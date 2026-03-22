import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  uri: string;
};

/** 贴近系统浏览器，减少被 ArcGIS/PIM 站点拒绝或降级 */
const IOS_SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

/**
 * 内嵌官方 PIM。站点体量大，WebView 可能较慢；超时后收起遮罩并提示用系统浏览器。
 */
export function SfPimEmbeddedMap({ uri }: Props) {
  const [loading, setLoading] = useState(true);
  const [slowHint, setSlowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setSlowHint(false);
    setError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSlowHint(true);
      setLoading(false);
    }, 22000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [uri]);

  const clearLoadTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const userAgent = Platform.OS === "android" ? ANDROID_CHROME_UA : IOS_SAFARI_UA;

  return (
    <View className="flex-1 bg-slate-950">
      {loading && !error ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-slate-950/95">
          <ActivityIndicator color="#00a3bf" size="large" />
          <Text className="mt-3 px-6 text-center text-xs text-slate-500">
            正在加载官方地图（页面较大，约需十余秒）…
          </Text>
        </View>
      ) : null}

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-slate-400">{error}</Text>
          <Text className="mt-2 text-center text-xs text-slate-600">
            可点击查询框右侧小图标在系统浏览器中打开完整页面。
          </Text>
        </View>
      ) : (
        <WebView
          key={uri}
          source={{ uri }}
          style={{ flex: 1, backgroundColor: "#0f172a" }}
          userAgent={userAgent}
          onLoadStart={() => {
            setError(null);
            setLoading(true);
          }}
          onLoadEnd={() => {
            clearLoadTimeout();
            setLoading(false);
          }}
          onError={() => {
            clearLoadTimeout();
            setLoading(false);
            setError("地图暂时无法在此视图中加载。");
          }}
          onHttpError={() => {
            clearLoadTimeout();
            setLoading(false);
            setError("地图暂时无法在此视图中加载。");
          }}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={Platform.OS === "ios"}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          originWhitelist={["https://*", "http://*"]}
          nestedScrollEnabled
          thirdPartyCookiesEnabled={Platform.OS === "android"}
          sharedCookiesEnabled
          androidLayerType="hardware"
        />
      )}

      {slowHint && !error ? (
        <View className="absolute bottom-1 left-1 right-1 rounded-lg bg-slate-900/90 px-2 py-1.5">
          <Text className="text-center text-2xs text-amber-200/90">
            若仍空白或卡顿，可点查询框旁「外链」图标用浏览器打开。
          </Text>
        </View>
      ) : null}
    </View>
  );
}
