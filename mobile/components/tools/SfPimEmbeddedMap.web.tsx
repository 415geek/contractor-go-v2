import { createElement, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

type Props = {
  uri: string;
};

/**
 * Web：使用原生 iframe 加载 PIM，通常比 RN WebView 封装更稳定。
 */
export function SfPimEmbeddedMap({ uri }: Props) {
  const [busy, setBusy] = useState(true);
  const [slowHint, setSlowHint] = useState(false);

  const onFrameLoad = useCallback(() => {
    setBusy(false);
  }, []);

  useEffect(() => {
    setBusy(true);
    setSlowHint(false);
    const t = setTimeout(() => {
      setSlowHint(true);
      setBusy(false);
    }, 25000);
    return () => clearTimeout(t);
  }, [uri]);

  return (
    <View className="flex-1 min-h-[320px] bg-slate-950">
      {busy ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-slate-950/95">
          <ActivityIndicator color="#60A5FA" size="large" />
          <Text className="mt-3 px-6 text-center text-xs text-slate-500">
            正在加载规划局地图（官方站点较大，请稍候）…
          </Text>
        </View>
      ) : null}
      {createElement("iframe", {
        title: "San Francisco Property Information Map",
        src: uri,
        allow: "geolocation; fullscreen",
        referrerPolicy: "no-referrer-when-downgrade",
        onLoad: onFrameLoad,
        style: {
          width: "100%",
          height: "100%",
          minHeight: 320,
          border: "none",
          flex: 1,
        },
      })}
      {slowHint ? (
        <View className="absolute bottom-1 left-1 right-1 rounded-lg bg-slate-900/90 px-2 py-1.5">
          <Text className="text-center text-2xs text-amber-200/90">
            若地图异常，请使用「在系统浏览器中打开」。
          </Text>
        </View>
      ) : null}
    </View>
  );
}
