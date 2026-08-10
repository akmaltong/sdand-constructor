// Worker polyfill: must be imported FIRST before any three imports.
// Three.js main entry point references `window` during module evaluation,
// which doesn't exist in a Web Worker (only `self`).
;(globalThis as any).window = globalThis

// GLTFLoader uses ImageLoader internally which creates `new Image()` and sets
// `.src` to a blob: URL decoded from the binary buffer.  In a Web Worker
// there is no DOM `Image`, so we provide one that decodes via createImageBitmap
// and exposes the pixel data for material colour sampling.
if (typeof (globalThis as any).Image === 'undefined') {
  ;(globalThis as any).Image = class WorkerImage {
    naturalWidth = 0
    naturalHeight = 0
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    crossOrigin: string = ''
    _bitmap: ImageBitmap | null = null

    get bitmap() {
      return this._bitmap
    }

    decode() {
      return Promise.resolve(this._bitmap ?? null)
    }

    set src(url: string) {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => createImageBitmap(blob, { premultiplyAlpha: 'none' }))
        .then((bitmap) => {
          this._bitmap = bitmap
          this.naturalWidth = bitmap.width
          this.naturalHeight = bitmap.height
          Promise.resolve().then(() => this.onload?.())
        })
        .catch(() => {
          Promise.resolve().then(() => this.onerror?.())
        })
    }
  }
}

// document.createElement('canvas') is needed by some three loaders
if (typeof (globalThis as any).document === 'undefined') {
  ;(globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 1,
          height: 1,
          getContext: () => null,
          toDataURL: () => '',
        }
      }
      return (globalThis as any).Image ? new (globalThis as any).Image() : {}
    },
    createElementNS: (_ns: string, tag: string) =>
      (globalThis as any).document.createElement(tag),
  }
}
