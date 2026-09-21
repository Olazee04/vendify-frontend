import Script from 'next/script';

export default function StoreLayout({
  children
}: {
  children: React.ReactNode
}) {
  const INTERCOM_APP_ID =
    process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

  return (
    <>
    {/* Add inside the layout return, before children: */}
<Script
  src="https://js.paystack.co/v1/inline.js"
  strategy="beforeInteractive"
/>
      {children}
      {/* Intercom Chat Widget */}
      {INTERCOM_APP_ID && (
        <Script id="intercom"
          strategy="afterInteractive">
          {`
            window.intercomSettings = {
              api_base: "https://api-iam.intercom.io",
              app_id: "${INTERCOM_APP_ID}",
            };
            (function(){var w=window;var ic=w.Intercom;
            if(typeof ic==="function"){ic('reattach_activator');
            ic('update',w.intercomSettings);}else{var d=document;
            var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};
            w.Intercom=i;var l=function(){var s=d.createElement('script');
            s.type='text/javascript';s.async=true;
            s.src='https://widget.intercom.io/widget/${INTERCOM_APP_ID}';
            var x=d.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s,x);};
            if(document.readyState==='complete'){l();}
            else if(w.attachEvent){w.attachEvent('onload',l);}
            else{w.addEventListener('load',l,false);}}})();
          `}
        </Script>
      )}
    </>
  );
}