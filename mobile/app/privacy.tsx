import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SUPPORT_EMAIL, COMPANY_BRAND, LEGAL_ENTITY_NAME } from "@/lib/company-legal";
import { WEB_APP_URL } from "@/lib/constants";

const LAST_UPDATED = "2026年3月23日";

/**
 * 公开页：供 App Store「隐私政策 URL」及未登录用户访问（根布局需放行 /privacy）。
 */
export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landing");
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
        <View className="flex-row items-center border-b border-surface-border px-3 py-2">
          <Pressable onPress={goBack} hitSlop={12} className="p-2" accessibilityLabel="返回">
            <Ionicons name="chevron-back" size={26} color="#94a3b8" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-ink pr-10">隐私政策</Text>
        </View>
        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text className="text-xs text-ink-tertiary mb-4">
            更新日期：{LAST_UPDATED}
            {Platform.OS === "web" ? `\n公开地址：${WEB_APP_URL}/privacy` : ""}
          </Text>

          <Section title="1. 概述">
            {COMPANY_BRAND}（「本应用」）由 {LEGAL_ENTITY_NAME} 运营。本政策说明我们如何处理在您使用本应用及相关服务时的个人信息。使用本应用即表示您同意本政策。
          </Section>

          <Section title="2. 我们收集的信息">
            <Bullet text="账户信息：通过第三方身份服务（如 Clerk）提供的手机号、电子邮箱等，用于登录与账户安全。" />
            <Bullet text="您主动提供的内容：项目与联系人信息、文字描述、为材料比价或估价等功能上传的照片。" />
            <Bullet text="虚拟号码与通信：为提供短信/语音相关能力，我们会处理与虚拟号码、会话及消息相关的必要元数据与内容（以实现翻译、投递与展示）。详见下节「短信与 A2P」。" />
            <Bullet text="订阅与支付：通过支付服务提供商（如 Stripe）处理时，我们一般不直接存储完整银行卡号；可能收到订阅状态与交易标识。" />
            <Bullet text="技术与日志：设备类型、应用版本、大致诊断与错误日志，用于保障服务稳定与安全。" />
          </Section>

          <Section title="3. 短信（SMS）与 A2P 消息">
            <Bullet text="用途：在您主动使用与本应用相关的短信/消息功能时，我们处理短信内容、收发人号码、时间戳、投递状态等，用于完成投递、在应用内展示会话、提供翻译或纠错、故障排查及履行法律义务。" />
            <Bullet text="运营商与互联：消息可能经由 Telnyx 等受监管电信运营商及其下游运营商网络传输；该等主体可能根据其政策处理为完成投递所必需的元数据。" />
            <Bullet text="同意与商业短信：若向您发送可能构成「商业」或「营销」性质的短信（视司法辖区定义而定），我们将在收集同意时单独说明用途与频率，并遵守退订规则。交易类或服务类短信可能在适用法律允许下无需额外选择加入。" />
            <Bullet text="退订与帮助：在适用场景下，您可按照消息中的说明回复 STOP（或其它公布的关键词）退订营销类短信，或回复 HELP 获取帮助；亦可通过应用内设置或《服务条款》所载方式联系我们。" />
            <Bullet text="留存：我们将在实现本政策目的所必需的期间内保留与消息相关的记录，具体取决于账户状态、争议解决与法律要求。" />
          </Section>

          <Section title="4. 我们如何使用信息">
            提供与维护核心功能（登录、项目与沟通、材料比价、虚拟号码相关服务）、改进产品体验、履行法律义务、在获得授权或法律允许范围内发送与服务相关通知。
          </Section>

          <Section title="5. 共享与受托处理">
            我们可能委托以下类型的服务提供商处理数据（以实现对应功能）：身份认证、云数据库与存储、短信/语音通信（如 Telnyx）、人工智能与图像理解、支付与订阅。我们会以合同等方式要求受托方采取合理保护措施，且仅在实现目的所必需的范围内处理数据。
          </Section>

          <Section title="6. 跨境与存储">
            部分服务提供商可能位于美国或其他司法辖区。在此情况下，我们将遵守适用法律要求并采取适当措施（如标准合同条款或同等机制，视适用法律而定）。
          </Section>

          <Section title="7. 保留期限">
            我们在实现本政策所述目的所必需的期间内保留信息，除非法律要求或允许更长的保留期。您可依法请求删除或限制处理，我们将在法律允许的范围内响应。
          </Section>

          <Section title="8. 您的权利">
            在适用法律下，您可能享有访问、更正、删除、限制或反对处理、数据可携带、撤回同意等权利。请通过本政策末尾联系方式与我们联系。
          </Section>

          <Section title="9. 儿童">
            本应用面向具有完全民事行为能力的用户。我们不会明知而收集儿童个人信息。
          </Section>

          <Section title="10. 本政策的变更">
            我们可能适时更新本政策。重大变更时，我们将通过应用内提示或网站公告等合理方式通知您。更新后的政策自文首日期或公告载明日期起生效。
          </Section>

          <Section title="11. 联系我们">
            {COMPANY_BRAND} 由 {LEGAL_ENTITY_NAME} 运营。如对本政策或您的个人信息有任何疑问，请发送邮件至 {SUPPORT_EMAIL}，或访问本应用/网站上的「联系我们」页面查看邮寄地址等公示信息。
          </Section>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-base font-semibold text-ink mb-2">{title}</Text>
      {typeof children === "string" ? (
        <Text className="text-[15px] leading-[24px] text-ink-secondary">{children}</Text>
      ) : (
        <View>{children}</View>
      )}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <Text className="text-[15px] leading-[24px] text-ink-secondary mb-2">
      • {text}
    </Text>
  );
}
