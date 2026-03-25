import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_APP_URL } from "@/lib/constants";
import { COMPANY_BRAND, LEGAL_ENTITY_NAME, SUPPORT_EMAIL } from "@/lib/company-legal";

const LAST_UPDATED = "2026年3月23日";

/**
 * 公开页：服务条款（含 messaging）；未登录须能访问（根布局放行 /terms）。
 */
export default function TermsOfServiceScreen() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landing");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
        <View className="flex-row items-center border-b border-surface-border px-3 py-2">
          <Pressable onPress={goBack} hitSlop={12} className="p-2" accessibilityLabel="返回">
            <Ionicons name="chevron-back" size={26} color="#94a3b8" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-ink pr-10">服务条款</Text>
        </View>
        <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-xs text-ink-tertiary mb-4">
            更新日期：{LAST_UPDATED}
            {Platform.OS === "web" ? `\n公开地址：${WEB_APP_URL}/terms` : ""}
          </Text>

          <Section title="1. 接受条款">
            <Text className="text-[15px] leading-[24px] text-ink-secondary">
              欢迎使用 {COMPANY_BRAND}（「本服务」）。本服务由 {LEGAL_ENTITY_NAME}（「我们」）提供。访问或使用本服务即表示您已阅读并同意受本条款约束。若您不同意，请勿使用本服务。本条款与我们的
              <Text className="font-semibold text-ink">《隐私政策》</Text>
              （说明含短信/消息相关数据处理）共同构成您与我们之间的协议。
            </Text>
          </Section>

          <Section title="2. 服务说明">
            本服务为承包商/技工等用户提供项目管理、沟通辅助、材料相关工具及可选的虚拟号码与消息能力。功能以实际上线版本为准；我们可能因维护、合规或第三方原因调整、暂停部分功能，并将合理努力在应用内或网站提示重大影响。
          </Section>

          <Section title="3. 短信与消息（SMS / MMS / A2P）">
            <Bullet text="当您使用与本服务相关的短信、彩信或其它应用对个人（A2P）消息功能时，您声明您已获得适用法律所要求的同意（包括对特定用途的同意），且您的联系人列表与消息内容合法、真实。" />
            <Bullet text="我们可能通过受监管的电信运营商及互联合作伙伴（例如 Telnyx 及下游运营商）路由消息。投递成功与否受运营商政策、号码状态、目的地管制与用户设备等因素影响；我们不保证每条消息在任意时点均可送达。" />
            <Bullet text="在适用法律允许的范围内，我们可能发送与服务相关的交易类或账户类短信（例如安全验证、服务状态）。若某司法辖区要求单独同意营销类短信，我们将在收集同意时单独说明；您可随时按提示或适用法律行使退订权。" />
            <Bullet text="对商业短信计划：在适用时，您可通过回复 STOP（或我们在消息中公布的其它退订关键词）或应用内设置退订营销类短信。回复 HELP 或联系支持邮箱可获取帮助。可能产生运营商短信资费，由您的套餐承担。" />
            <Bullet text="您不得将消息功能用于骚扰、欺诈、垃圾信息、违反《电信条例》或运营商可接受使用政策的行为。我们可在发现滥用或收到合规要求时限制或终止相关能力。" />
          </Section>

          <Section title="4. 账户与安全">
            您应妥善保管登录凭据，对在您账户下发生的活动负责。发现未经授权使用时，请立即通过应用内支持或本条款末尾邮箱通知我们。
          </Section>

          <Section title="5. 订阅与付款">
            部分功能可能以订阅或按量计费形式提供，具体价格与周期以应用内或结账页展示为准。通过第三方支付服务商完成的付款，受其条款与隐私政策约束。除非法律另有规定，已支付费用一般不予退还。
          </Section>

          <Section title="6. 内容与知识产权">
            您保留您提交内容中的权利；为提供本服务，您授予我们在全球范围内非独占、可转授权的许可，以托管、处理、展示及技术性地传输该等内容（例如消息投递与翻译）。本服务本身的界面、标识与软件受适用法律保护。
          </Section>

          <Section title="7. 免责声明与责任限制">
            在适用法律允许的最大范围内，本服务按「现状」提供。我们不保证服务不间断或无错误。对因使用或无法使用本服务而产生的任何间接、附带、特殊或后果性损害，我们在法律允许范围内不承担责任。
          </Section>

          <Section title="8. 终止">
            您可随时停止使用本服务。若您严重违反本条款（含消息滥用），我们可暂停或终止您对相关功能的访问。
          </Section>

          <Section title="9. 适用法律与争议">
            除非强制性法律另有规定，本条款的解释与争议解决应适用服务主要运营地法律，并由该地有管辖权的法院管辖。
          </Section>

          <Section title="10. 条款变更">
            我们可能不时更新本条款。重大变更将通过应用内提示、网站公告或电子邮件（若我们有您的联系方式）等合理方式通知。更新后您继续使用本服务即视为接受修订条款。
          </Section>

          <Section title="11. 联系我们">
            对本条款或消息计划有疑问，请发送邮件至 {SUPPORT_EMAIL}，或访问应用内「联系我们」页面查看邮寄地址等公示信息。
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
    <Text className="text-[15px] leading-[24px] text-ink-secondary mb-2">• {text}</Text>
  );
}
