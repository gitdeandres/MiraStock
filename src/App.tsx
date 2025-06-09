import { useEffect, useRef, useState } from 'react'
import './App.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { error as logError, info as logInfo } from '@tauri-apps/plugin-log'

interface Product {
  name: string
  stock: number
  price: number
}

export default function App() {
  const [sku, setSku] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, setCountdown] = useState(5)
  const [loading, setLoading] = useState(false)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let inputBuffer = ''
    let bufferTimeout: ReturnType<typeof setTimeout>

    const handleKeyPress = (e: KeyboardEvent) => {
      // Evita entradas accidentales si estás en un input de texto
      if ((e.target as HTMLElement).tagName === 'INPUT' || loading) return

      clearTimeout(bufferTimeout)

      if (e.key === 'Enter') {
        if (inputBuffer.length > 0) {
          lookupProduct(inputBuffer.trim())
          inputBuffer = ''
        }
      } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
        inputBuffer += e.key

        // Seguridad: limpia si pasa mucho tiempo entre teclas
        bufferTimeout = setTimeout(() => {
          inputBuffer = ''
        }, 300)
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  useEffect(() => {
    if (product || error) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdownRef.current as NodeJS.Timeout)
            reset()
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [product, error])

  const lookupProduct = async (code: string) => {
    if (loading) return // Evita múltiples búsquedas

    setLoading(true)
    setError(null)
    setProduct(null)
    setCountdown(5)
    setSku(code)

    logInfo(`Buscando producto con SKU: '${code}'`)
    try {
      const baseUrl = import.meta.env.VITE_BIOQUIMICAPI_URL
      const url = new URL('product/stockprice', baseUrl)
      url.searchParams.set('sku', code)

      const response = await fetch(url.toString())

      const responseText = await response.text()
      logInfo(`Respuesta de la API: ${response.status} ${responseText}`)

      if (response.ok) {
        const data = await response.json()
        const info = data?.data
        const { name, price, stock } = info ?? {}

        if (!name || price == null || stock == null) {
          setError('Producto no encontrado o incompleto')
        } else {
          setProduct({ name, price, stock })
        }

      } else if (response.status === 404) {
        setError('Producto no encontrado')
      } else {
        setError('Error en la búsqueda del producto')
      }
    } catch (err) {
      logError(`Error inesperado al buscar el producto: ${err}`)
      setError('No se pudo realizar la búsqueda del producto')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setSku(null)
    setProduct(null)
    setError(null)
    setCountdown(5)
  }

  return (
    <>
      {!product && !error && (
        <div id="home-view" className="view home-view px-4">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-gray-800 mb-2">
              Escáner de Productos
            </h1>
            <p className="text-2xl text-gray-600">
              Escanee el código de barras del producto
            </p>
          </div>

          <div className={`scan-animation mb-8 ${loading ? 'paused' : ''}`}>
            {!loading && <div className="scanner-line"></div>}
            <i className="fas fa-barcode text-6xl text-blue-500"></i>
          </div>

          {loading
          ?(<div className="flex items-center justify-center gap-2 text-gray-800 text-xl font-medium mt-4">
              <i className="fas fa-spinner fa-spin"></i>
              Buscando producto... Favor espere
            </div>)
          :(<div className="text-center text-gray-500">
              <p className="text-xl">Esperando escaneo...</p>
            </div>)}

        </div>
      )}

      {(product || error) && (
        <div id="product-view" className="view product-view p-4 active">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              Detalles del Producto
            </h2>
          </div>

          {product && (
            <div className="product-card p-6">
              <div className="mb-7">
                <label className="block text-xl font-medium text-gray-500">SKU</label>
                <div id="product-sku" className="text-3xl font-semibold text-gray-800">
                  {sku}
                </div>
              </div>

              <div className="mb-7">
                <label className="block text-xl font-medium text-gray-500">
                  Nombre del Producto
                </label>
                <div id="product-name" className="text-3xl font-semibold text-gray-800">
                  {product.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xl font-medium text-gray-500">
                    Stock
                  </label>
                  <div
                    id="product-stock"
                    className="text-5xl font-semibold text-gray-800"
                  >
                    {product.stock}
                  </div>
                </div>

                <div>
                  <label className="block text-xl font-medium text-gray-500"
                    >Precio</label
                  >
                  <div
                    id="product-price"
                    className="text-5xl font-semibold text-green-600"
                  >
                    {product.price === 0
                    ? 'Sin información'
                    : `$${product.price.toLocaleString('es-CL')}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div id="error-message" className="error-message">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span id="error-text">{error}</span>
              <p className='text-end text-xs'>SKU {sku}</p>
            </div>
          )}

        </div>
      )}
    </>
  )
}
