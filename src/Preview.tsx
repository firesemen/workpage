import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createResumePdf } from "./ResumeDocument";
import type { Resume } from "./model";
import { LoaderCircle } from "lucide-react";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export default function Preview({ resume }: { resume: Resume }) {
  const host = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [pages, setPages] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const id = ++generation.current;
    let cancelled = false;
    setBusy(true);
    const timer = setTimeout(async () => {
      let doc: pdfjs.PDFDocumentProxy | undefined;
      let loading: pdfjs.PDFDocumentLoadingTask | undefined;
      try {
        const blob = await createResumePdf(resume);
        if (cancelled) return;
        loading = pdfjs.getDocument({
          data: new Uint8Array(await blob.arrayBuffer()),
        });
        doc = await loading.promise;
        const fragment = document.createDocumentFragment();
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `Страница ${n} резюме`);
          await page.render({ canvas, viewport }).promise;
          const wrapper = document.createElement("div");
          wrapper.className = "pdf-sheet";
          wrapper.appendChild(canvas);
          fragment.appendChild(wrapper);
        }
        if (!cancelled && generation.current === id) {
          host.current?.replaceChildren(fragment);
          setPages(doc.numPages);
          setError("");
        }
      } catch (e) {
        if (!cancelled)
          setError(
            "Не удалось обновить предпросмотр. Проверьте данные и попробуйте ещё раз.",
          );
      } finally {
        await loading?.destroy();
        if (!cancelled) setBusy(false);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resume]);
  return (
    <div className="pdf-preview">
      <div className="preview-status" aria-live="polite">
        {busy ? (
          <>
            <LoaderCircle size={13} className="spin" />
            Обновляем…
          </>
        ) : pages ? (
          `${pages} ${pages === 1 ? "страница" : pages < 5 ? "страницы" : "страниц"}`
        ) : (
          ""
        )}
      </div>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <div ref={host} className="pdf-pages" />
      {!pages && busy && (
        <div className="preview-loading">
          <LoaderCircle className="spin" />
          Готовим ваш лист…
        </div>
      )}
    </div>
  );
}
