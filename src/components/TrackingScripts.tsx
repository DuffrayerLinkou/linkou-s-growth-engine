import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function TrackingScripts() {
  const { data: settings } = useQuery({
    queryKey: ["landing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  useEffect(() => {
    if (!settings) return;

    // Meta Pixel
    if (settings.meta_pixel_enabled && settings.meta_pixel_id) {
      const script = document.createElement("script");
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.meta_pixel_id}');
        fbq('track', 'PageView');
      `;
      script.id = "meta-pixel";
      if (!document.getElementById("meta-pixel")) {
        document.head.appendChild(script);
      }
    }

    // Google Tag Manager - Head
    if (settings.gtm_enabled && settings.gtm_id) {
      const gtmScript = document.createElement("script");
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${settings.gtm_id}');
      `;
      gtmScript.id = "gtm-script";
      if (!document.getElementById("gtm-script")) {
        document.head.appendChild(gtmScript);
      }

      // GTM noscript iframe
      const noscript = document.createElement("noscript");
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${settings.gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      noscript.id = "gtm-noscript";
      if (!document.getElementById("gtm-noscript") && document.body.firstChild) {
        document.body.insertBefore(noscript, document.body.firstChild);
      }
    }

    // Google Analytics 4
    if (settings.ga4_enabled && settings.ga4_measurement_id) {
      const ga4Loader = document.createElement("script");
      ga4Loader.src = `https://www.googletagmanager.com/gtag/js?id=${settings.ga4_measurement_id}`;
      ga4Loader.async = true;
      ga4Loader.id = "ga4-loader";
      if (!document.getElementById("ga4-loader")) {
        document.head.appendChild(ga4Loader);
      }

      const ga4Script = document.createElement("script");
      ga4Script.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.ga4_measurement_id}');
      `;
      ga4Script.id = "ga4-script";
      if (!document.getElementById("ga4-script")) {
        document.head.appendChild(ga4Script);
      }
    }

    // TikTok Pixel
    if (settings.tiktok_pixel_enabled && settings.tiktok_pixel_id) {
      const tiktokScript = document.createElement("script");
      tiktokScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${settings.tiktok_pixel_id}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      tiktokScript.id = "tiktok-pixel";
      if (!document.getElementById("tiktok-pixel")) {
        document.head.appendChild(tiktokScript);
      }
    }

    // Google Ads
    if (settings.google_ads_enabled && settings.google_ads_id) {
      const gadsLoader = document.createElement("script");
      gadsLoader.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_ads_id}`;
      gadsLoader.async = true;
      gadsLoader.id = "gads-loader";
      if (!document.getElementById("gads-loader")) {
        document.head.appendChild(gadsLoader);
      }

      const gadsScript = document.createElement("script");
      gadsScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.google_ads_id}');
      `;
      gadsScript.id = "gads-script";
      if (!document.getElementById("gads-script")) {
        document.head.appendChild(gadsScript);
      }
    }

    // LinkedIn Insight Tag
    if (settings.linkedin_enabled && settings.linkedin_partner_id) {
      const linkedinScript = document.createElement("script");
      linkedinScript.innerHTML = `
        _linkedin_partner_id = "${settings.linkedin_partner_id}";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        (function(l) {
          if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
          window.lintrk.q=[]}
          var s = document.getElementsByTagName("script")[0];
          var b = document.createElement("script");
          b.type = "text/javascript";b.async = true;
          b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
          s.parentNode.insertBefore(b, s);})(window.lintrk);
      `;
      linkedinScript.id = "linkedin-insight";
      if (!document.getElementById("linkedin-insight")) {
        document.head.appendChild(linkedinScript);
      }
    }

    // Hotjar
    if (settings.hotjar_enabled && settings.hotjar_id) {
      const hotjarScript = document.createElement("script");
      hotjarScript.innerHTML = `
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${settings.hotjar_id},hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `;
      hotjarScript.id = "hotjar-script";
      if (!document.getElementById("hotjar-script")) {
        document.head.appendChild(hotjarScript);
      }
    }

    // Chat Widget
    if (settings.chat_widget_enabled && settings.chat_widget_script) {
      const chatDiv = document.createElement("div");
      chatDiv.id = "chat-widget-container";
      chatDiv.innerHTML = settings.chat_widget_script;
      if (!document.getElementById("chat-widget-container")) {
        document.body.appendChild(chatDiv);
        // Execute scripts within the container
        const scripts = chatDiv.getElementsByTagName("script");
        for (let i = 0; i < scripts.length; i++) {
          const newScript = document.createElement("script");
          if (scripts[i].src) {
            newScript.src = scripts[i].src;
          } else {
            newScript.innerHTML = scripts[i].innerHTML;
          }
          document.body.appendChild(newScript);
        }
      }
    }

    // Custom head scripts
    if (settings.head_scripts) {
      const customHead = document.createElement("div");
      customHead.id = "custom-head-scripts";
      customHead.innerHTML = settings.head_scripts;
      if (!document.getElementById("custom-head-scripts")) {
        const scripts = customHead.getElementsByTagName("script");
        for (let i = 0; i < scripts.length; i++) {
          const newScript = document.createElement("script");
          if (scripts[i].src) {
            newScript.src = scripts[i].src;
          } else {
            newScript.innerHTML = scripts[i].innerHTML;
          }
          document.head.appendChild(newScript);
        }
      }
    }

    // Custom body scripts
    if (settings.body_scripts) {
      const customBody = document.createElement("div");
      customBody.id = "custom-body-scripts";
      customBody.innerHTML = settings.body_scripts;
      if (!document.getElementById("custom-body-scripts")) {
        const scripts = customBody.getElementsByTagName("script");
        for (let i = 0; i < scripts.length; i++) {
          const newScript = document.createElement("script");
          if (scripts[i].src) {
            newScript.src = scripts[i].src;
          } else {
            newScript.innerHTML = scripts[i].innerHTML;
          }
          document.body.appendChild(newScript);
        }
      }
    }
  }, [settings]);

  return null;
}
