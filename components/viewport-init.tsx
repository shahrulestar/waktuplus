import Script from "next/script"

/** Sets viewport flags on <html> before first paint to avoid desktop layout flash on mobile. */
export function ViewportInit() {
  return (
    <Script id="viewport-init" strategy="beforeInteractive">
      {`(function(){try{var w=window.innerWidth||document.documentElement.clientWidth||390;document.documentElement.style.setProperty('--viewport-width',w+'px');document.documentElement.dataset.compact=w<1024?'true':'false'}catch(e){}})();`}
    </Script>
  )
}
