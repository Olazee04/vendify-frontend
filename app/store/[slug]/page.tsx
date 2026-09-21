import { Metadata } from "next";
import Script from "next/script";
import PublicStorePage from "./PublicStorePage";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} - Vendify Store`,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag("js", new Date());
              gtag("config", "${GA_ID}");
            `}
          </Script>
        </>
      )}

      {FB_PIXEL_ID && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,"script",
            "https://connect.facebook.net/en_US/fbevents.js");
            fbq("init", "${FB_PIXEL_ID}");
            fbq("track", "PageView");
          `}
        </Script>
      )}

      <PublicStorePage slug={slug} />
    </>
  );
}
