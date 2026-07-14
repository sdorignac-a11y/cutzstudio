'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '../../../lib/supabaseClient';

// Corrige la escala del modelo 3D para que coincida con las medidas reales
// cargadas en el producto (alto/ancho/fondo en cm) — sin esto, el tamaño en
// AR depende únicamente de cómo haya salido escalado el archivo .glb, que
// puede no tener nada que ver con las medidas reales del mueble.
function applyRealScale(modelViewer, alto, ancho, fondo) {
  function doScale() {
    try {
      const dims = modelViewer.getDimensions();
      const current = modelViewer.scale || { x: 1, y: 1, z: 1 };

      const baseX = dims.x / (current.x || 1);
      const baseY = dims.y / (current.y || 1);
      const baseZ = dims.z / (current.z || 1);

      const targetX = (Number(ancho) || 0) / 100;
      const targetY = (Number(alto) || 0) / 100;
      const targetZ = (Number(fondo) || 0) / 100;

      // Un factor por eje (no un promedio) — así las tres medidas
      // quedan exactas, aunque eso implique estirar un poco la forma
      // si el modelo 3D no tenía las mismas proporciones reales.
      const scaleX = baseX > 0 && targetX > 0 ? targetX / baseX : 1;
      const scaleY = baseY > 0 && targetY > 0 ? targetY / baseY : 1;
      const scaleZ = baseZ > 0 && targetZ > 0 ? targetZ / baseZ : 1;

      if (![scaleX, scaleY, scaleZ].every((n) => isFinite(n) && n > 0)) {
        return;
      }

      modelViewer.setAttribute('scale', `${scaleX} ${scaleY} ${scaleZ}`);
    } catch (e) {
      // si algo falla, dejamos el modelo con su escala original
    }
  }

  modelViewer.addEventListener('load', doScale);
  if (modelViewer.loaded) doScale();

  return () => modelViewer.removeEventListener('load', doScale);
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewerRef = useRef(null);
  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!product || !viewerRef.current) return;
    return applyRealScale(viewerRef.current, product.alto, product.ancho, product.fondo);
  }, [product]);
  if (loading) return <main style={{ padding: '60px 6vw' }}>Cargando…</main>;
  if (!product) return <main style={{ padding: '60px 6vw' }}>Producto no encontrado (o todavía no está publicado).</main>;
  return (
    <main style={{ padding: '40px 6vw', maxWidth: 700 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 26 }}>{product.name}</div>
      <div className="mono" style={{ fontSize: 15, color: 'var(--wood)', marginTop: 6 }}>{product.price}</div>
      <div className="mono" style={{ fontSize: 12, color: '#8a8375', marginTop: 6 }}>
        {product.alto} × {product.ancho} × {product.fondo} cm
      </div>
      {Array.isArray(product.extra_measurements) && product.extra_measurements.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {product.extra_measurements
            .filter((m) => m && m.label && m.value)
            .map((m, i) => (
              <span
                key={i}
                className="mono"
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: 'var(--wood)',
                  background: '#f3e8d7',
                  padding: '3px 8px',
                  borderRadius: 999,
                }}
              >
                {m.label}: {m.value}
              </span>
            ))}
        </div>
      )}
      <div style={{
        marginTop: 24, height: 380, borderRadius: 4, overflow: 'hidden',
        background: 'linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px),#fbfaf6',
        backgroundSize: '22px 22px',
      }}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <model-viewer
          ref={viewerRef}
          src={product.model_url}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          exposure="0.95"
          environment-image="neutral"
          camera-orbit="35deg 78deg 2.6m"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          style={{ width: '100%', height: '100%' }}
        >
          <button
            slot="ar-button"
            style={{ background: 'var(--wood)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 3, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Ver en tu espacio (AR)
          </button>
        </model-viewer>
      </div>
      <p style={{ fontSize: 11.5, color: '#8a8375', marginTop: 12 }}>
        Desde el celular, el botón abre la cámara real. Desde notebook solo se ve el modelo 3D interactivo.
      </p>

      {/* Widget de Reality — mismo código que le damos a un cliente real,
          en modo manual: le decimos directo qué producto es (por id),
          así no depende de que el slug coincida con la URL. */}
      <Script src="https://cutzstudio.vercel.app/widget.js" strategy="afterInteractive" />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <div data-ebano-product={product.id} data-store={product.owner_id}></div>
    </main>
  );
}
