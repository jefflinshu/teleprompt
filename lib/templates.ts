import type { Section } from "./store";
import { getLocale, type Locale } from "./i18n";

export interface ScriptTemplate {
  id: string;
  title: string;
  emoji: string;
  tag: string;
  tagColor: string;
  description: string;
  sections: Omit<Section, "id">[];
}

export function getTemplates(): ScriptTemplate[] {
  const locale = getLocale();
  return locale === "zh" ? TEMPLATES_ZH : TEMPLATES_EN;
}

// ---------------------------------------------------------------------------
// Chinese Templates
// ---------------------------------------------------------------------------

const TEMPLATES_ZH: ScriptTemplate[] = [
  {
    id: "product-launch",
    title: "产品发布",
    emoji: "🚀",
    tag: "商业",
    tagColor: "#ff6b6b",
    description: "三段式产品发布文稿，包含开场吸引、现场演示和限时优惠。",
    sections: [
      {
        title: "开场",
        content:
          "大家晚上好，欢迎来到我们过去十八个月一直在打造的时刻。我是张明，星辰科技的联合创始人。今晚，我们将揭开一款将彻底改变你与家居互动方式的产品。在展示之前，让我先描述一个场景：你有多少次拖着疲惫的身体回到家，摸索着开关灯，希望家里能自动理解你的需求？这种挫败感正是我们创业的起点。我们倾听了超过一万位用户的反馈，一个声音响亮而清晰——技术应该适应人，而不是反过来。所以今晚，我非常激动地向大家介绍：星辰 Aura。",
        duration: 90,
      },
      {
        title: "产品演示",
        content:
          "让我带大家看看星辰 Aura 实际能做什么。请看屏幕。当我走过这个模拟门口时，系统检测到我的存在，自动将灯光调整到我保存的晚间模式，播放我的放松歌单，并将空调调到二十二度——全部在两秒内完成，我一个字都没说。接下来才是重点：Aura 会学习。使用一周后，它发现工作日我喜欢柔和的暖光，而周末我喜欢客厅明亮便于阅读。无需 app，无需语音指令，就是无缝适应。它完全在本地运行，你的数据永远不会离开家。隐私不是我们后期添加的功能——它是基石。",
        duration: 120,
      },
      {
        title: "限时优惠",
        content:
          "现在说说如何成为首批体验者。我们今天开放创始会员名额——仅限前五千名。创始会员将获得星辰 Aura 主机、两个房间传感器和终身软件订阅，全部只要一千九百九十九元。这是下季度公布零售价的六折。此外，每位创始会员还能优先获取明年春季推出的扩展模块。扫描屏幕上的二维码或访问 xingchen.com/founder 立即下单。名额满五千即止。感谢你们相信更智能、更简单的家居。让我们一起构建未来。",
        duration: 90,
      },
    ],
  },
  {
    id: "news-anchor",
    title: "新闻播报",
    emoji: "📰",
    tag: "新闻",
    tagColor: "#4ecdc4",
    description: "四段式晚间新闻播报，包含开场头条、两则深度报道和结束语。",
    sections: [
      {
        title: "开场",
        content:
          "晚上好，欢迎收看六点新闻联播。我是李思琪。今晚为您带来两条正在塑造全球格局的热点新闻。首先，经过日内瓦马拉松式谈判达成的里程碑式气候协议，为全球最大经济体设定了雄心勃勃的新碳排放目标。其次，国内方面，中小企业贷款的意外激增引发了经济学家的谨慎乐观。我们还将为您带来完整的周末天气预报和今晚的体育赛事前瞻。让我们开始。",
        duration: 60,
      },
      {
        title: "报道一",
        subtitle: "国际",
        content:
          "来自一百九十多个国家的代表于今早结束了在日内瓦为期五天的会谈，签署了被许多人称为十年来最重要的气候协议。该协议要求前二十大排放国在二零三四十前将温室气体排放减少百分之三十五，并由八百亿美元的合规基金提供支持。协议还首次引入了碳边境关税，防止工业向法规宽松的国家转移。环保组织对目标表示赞赏，但警告执行机制仍然模糊。我们的记者陈美琪报道，下一个关键里程碑将是各国立法机构在未来几个月内的批准投票。",
        duration: 120,
      },
      {
        title: "报道二",
        subtitle: "财经",
        content:
          "来看经济方面，央行最新数据显示，一季度中小企业贷款审批量增长百分之十二，是近三年来最快增速。分析师将这一增长归因于利率下降、社区银行计划扩大以及服务业消费支出的回暖。餐饮和零售初创企业领跑，占所有新审批的近一半。然而，一些专家提醒需谨慎，指出小额贷款的违约率也有所上升。我们采访了本市三位新企业主，他们分享了及时信贷如何帮助他们开业——完整故事请访问我们的网站。",
        duration: 120,
      },
      {
        title: "结束语",
        content:
          "以上就是今晚的新闻。提醒您，两条报道的深度内容和独家采访可在我们的网站和客户端上收看。明天我们将专题报道正在重塑公共交通的科技初创企业。我是李思琪，感谢收看，我们明晚六点再见。",
        duration: 60,
      },
    ],
  },
  {
    id: "keynote-speech",
    title: "主题演讲",
    emoji: "🎤",
    tag: "演讲",
    tagColor: "#a78bfa",
    description: "三幕式演讲结构——吸引听众、传递核心信息、行动号召收尾。",
    sections: [
      {
        title: "开场",
        content:
          "谢谢大家，早上好。我想先问一个听起来简单但其实很难回答的问题——你上次改变一个重要观点是什么时候？不是午餐吃什么或通勤路线，而是一个你深信不疑的信念。研究表明，成年人平均大约每七年才会更新一次核心信念。七年。在这个每隔几个月就在自我重塑的世界里，我们的思维很难跟上节奏。今天我想探讨这个差距为何存在，更重要的是，我们能做些什么。因为我相信，个人和组织最大的竞争优势——就是愿意更快地承认错误。",
        duration: 90,
      },
      {
        title: "主体",
        content:
          "让我分享一个故事。二零一九年，我们团队非常确定旗舰产品应该转向订阅模式。每份数据都支持，每位顾问都同意。但一位初级分析师问了一个没人想听的问题：如果我们的用户不认同自己是订阅者呢？我们起初没有理会。三个月后，经过痛苦的发布和一波退订，我们意识到她是对的。用户想要的是拥有，而不是租用。这个被忽视的洞察让我们损失了八千万元。教训是——确定感让人觉得高效，但它往往只是舒适。真正成功的团队会把结构化的质疑融入流程。他们在发布前做预验尸分析，在每次战略会议中指定唱反调的人，奖励那些说出不舒服真相的人。这不是优柔寡断，而是严谨。没有争论的数据只是装饰。",
        duration: 180,
      },
      {
        title: "收尾",
        content:
          "所以我给大家一个挑战。在离开这个会场之前，找一个组织里所有人都认同的观点——然后去压力测试它。问那个不舒服的问题。把反对的声音请进会议室。你可能会发现，你最大的风险不是竞争对手或市场，而是那个你从未质疑过的假设。感谢大家的时间。我真心期待在接下来的交流中被证明是错的。祝大家峰会愉快。",
        duration: 60,
      },
    ],
  },
  {
    id: "vlog-intro",
    title: "Vlog 开场",
    emoji: "🎬",
    tag: "视频",
    tagColor: "#f59e0b",
    description: "两段式 Vlog 开场，前十秒抓住观众，然后介绍今日计划。",
    sections: [
      {
        title: "开场",
        content:
          "各位观众大家好！欢迎回到频道。如果你是新观众，我是阿凯，我做美食、旅行，偶尔也挑战一些让我害怕的事情——今天就是这样的日子。我现在站在一座有七十年历史的老火车站前，大约十分钟后我将登上一列没有预订酒店、没有行程、只有一个背包的火车。规则很简单——火车停哪我就停哪。点个关注，因为这期会很精彩。",
        duration: 60,
      },
      {
        title: "今日计划",
        content:
          "好，大致计划是这样的。我有四十八小时的窗口，有三条北上的火车线路可选。上次投票你们选了沿海线路，经过渔村和古城，所以我们就走这条。沿途我想至少尝试三道当地美食，找到五十元以下的住处，还有——这是加分项——在一个旅行论坛上看到的悬崖上看日落。如果成功了，这可能是最好的一期。如果失败了，你们也能看到全过程。我们去买票吧。",
        duration: 60,
      },
    ],
  },
  {
    id: "tech-review",
    title: "科技评测",
    emoji: "📱",
    tag: "科技",
    tagColor: "#06b6d4",
    description: "四段式科技评测，涵盖第一印象、设计、性能测试和最终结论。",
    sections: [
      {
        title: "开场",
        content:
          "大家好，欢迎回来。今天我们来深度体验星辰 Pixel 9 Pro，它已经在我手上整整两周了。我把它当作主力机——没有备用机，没有作弊。这次评测我会覆盖外观设计、屏幕、实际性能、拍照和续航，最后告诉你它值不值四千九百九十九元的售价。开始吧。",
        duration: 60,
        notes: "展示产品包装和开箱画面",
      },
      {
        title: "设计与屏幕",
        subtitle: "硬件",
        content:
          "先说设计，星辰今年用了平面钛金属边框，手感真的很棒。重量一百八十七克，恰到好处。正面是一块六点七英寸 LTPO AMOLED 屏幕，支持一到一百二十赫兹自适应刷新。峰值亮度两千两百尼特，我确认——户外阳光下完全没问题。出厂色彩准确度测得 Delta E 零点八，几乎就是专业级。边框比去年更窄，屏下指纹明显更快了。",
        duration: 90,
        notes: "规格：6.7寸 LTPO AMOLED，2200尼特峰值，钛金属边框，187克，屏下指纹",
      },
      {
        title: "性能",
        subtitle: "跑分与续航",
        content:
          "硬件方面搭载了天玑 9200 芯片，基础版 8GB 内存，128GB 存储。日常使用——邮件、社交媒体、十个以上应用同时运行——完全不卡。游戏表现同样出色；我们在最高画质下跑原神，稳定五十九到六十帧，二十分钟后才有轻微降频。续航才是亮点：五千毫安时电池轻松撑过一天，睡前还剩百分之三十左右。亮屏时间平均七小时四十分钟。充电支持六十七瓦有线，十八分钟从零充到百分之五十。",
        duration: 120,
        notes: "天玑9200，8GB内存，128GB存储，5000毫安时，67瓦有线充电，7小时40分亮屏",
      },
      {
        title: "总结",
        content:
          "最后总结。星辰 Pixel 9 Pro 不是革命性飞跃，但它是一款极其均衡的手机。屏幕同级最佳，性能顶级，续航终于达到了旗舰应有的水平。拍照——我会单独出视频——非常有竞争力但夜拍还不是最强。四千九百九十九元的价格卡在旗舰和超旗舰之间的甜蜜点，却提供了百分之九十五的体验。如果你是从两年前的手机升级，强烈推荐。评论区留言，我会尽量回复。感谢观看，下期见。",
        duration: 90,
      },
    ],
  },
  {
    id: "online-course",
    title: "课程讲解",
    emoji: "📚",
    tag: "教育",
    tagColor: "#10b981",
    description: "三段式课堂流程——复习旧知、引入新课、答疑总结。",
    sections: [
      {
        title: "复习",
        content:
          "大家好，欢迎回来。进入今天的话题之前，我们快速回顾一下上周的内容。我们讲了供需基础——价格信号如何在没有中央计划者的情况下协调买卖双方的决策。记住核心要点：当商品价格上涨，需求量趋于下降，供给量趋于上升，其他条件不变。我们还分析了两个现实案例——网约车动态定价和季节性农产品市场。如果感觉模糊了，强烈建议复习第四章总结，下周有小测验。进入新内容前有问题吗？",
        duration: 90,
      },
      {
        title: "新课",
        subtitle: "市场均衡",
        content:
          "好，今天讲市场均衡——供给和需求相交的点。这是经济学入门最重要的概念之一，因为它解释了市场如何在没有人为干预的情况下确定价格和数量。我在黑板上画一下。纵轴是价格，横轴是数量。需求曲线向下倾斜，供给曲线向上倾斜，它们交叉的地方就是均衡点。在这一点上，买方想购买的数量正好等于卖方想生产的数量。那么，市场不在均衡时会怎样？如果价格高于均衡，就会出现供给过剩——卖方库存比买方需求多。如果价格低于均衡，就会出现短缺——买方抢购，卖方断货。市场会自动修正：供给过剩压低价格，短缺推高价格，我们又回到均衡。这种自我修正机制就是亚当·斯密所说的'看不见的手'。",
        duration: 180,
      },
      {
        title: "答疑",
        content:
          "好，暂停一下提问。我知道均衡可能比较抽象，所以不要犹豫，即使觉得基础也可以问。趁大家思考的时候，布置一下作业——阅读第五章第一到第三节，做章末的两道练习题。下节课一开始我们一起讲解。另外，答疑时间是周四下午两点到四点。如果图表部分有困难，那是来和我一起做例题的好时间。今天就到这里，下周见。",
        duration: 60,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// English Templates
// ---------------------------------------------------------------------------

const TEMPLATES_EN: ScriptTemplate[] = [
  {
    id: "product-launch",
    title: "Product Launch",
    emoji: "🚀",
    tag: "Business",
    tagColor: "#ff6b6b",
    description:
      "A three-part product launch script covering the hook, live demo, and a limited-time offer to drive conversions.",
    sections: [
      {
        title: "Opening",
        content:
          "Good evening, everyone, and welcome to the moment we have been building toward for the past eighteen months. My name is Jordan Pace and I am the co-founder of Lumora Technologies. Tonight we are pulling back the curtain on a product that will fundamentally change the way you interact with your home. Before I show you what it is, let me paint a picture. How many times have you walked through your front door exhausted, fumbled for a light switch, and wished your home just knew what you needed? That frustration is exactly where our journey began. We listened to over ten thousand customer interviews, and one message came through loud and clear — technology should adapt to people, not the other way around. So tonight, I am thrilled to introduce the Lumora Aura.",
        duration: 90,
      },
      {
        title: "Product Demo",
        content:
          "Let me walk you through what the Lumora Aura can actually do. Watch the screen behind me. As I step through this mock doorway the system detects my presence, adjusts the lighting to my saved evening profile, starts my wind-down playlist, and sets the thermostat to seventy-two degrees — all within two seconds and without me saying a single word. Now here is where it gets interesting. The Aura learns. After one week it understood that on weekdays I prefer dim warm light, but on weekends I like the living room bright for reading. No app, no voice command, just seamless adaptation. It runs entirely on-device so your data never leaves your home. Privacy is not a feature we bolt on — it is the foundation.",
        duration: 120,
      },
      {
        title: "Limited Offer",
        content:
          "Now let us talk about how you can be among the first to experience this. We are opening our Founders Circle today — limited to the first five thousand orders. Founders Circle members receive the Lumora Aura hub, two room sensors, and a lifetime software subscription, all for two hundred and ninety-nine dollars. That is forty percent off the retail price we will announce next quarter. On top of that, every Founders Circle member gets priority access to our expansion modules launching next spring. Scan the QR code on screen or visit lumora dot com slash founders right now. This offer closes at midnight, and once the five thousand spots are filled, they are gone. Thank you for believing in a smarter, simpler home. Let us build the future together.",
        duration: 90,
      },
    ],
  },
  {
    id: "news-anchor",
    title: "News Report",
    emoji: "📰",
    tag: "News",
    tagColor: "#4ecdc4",
    description:
      "A four-segment evening news broadcast with opening headlines, two in-depth stories, and a sign-off.",
    sections: [
      {
        title: "Opening",
        content:
          "Good evening and welcome to the six o'clock report. I'm Allison Grant. Tonight we bring you two developing stories that are shaping headlines around the world. First, a landmark climate agreement reached after marathon negotiations in Geneva has set ambitious new carbon targets for the world's largest economies. Then, closer to home, a surprising surge in small-business lending is sparking cautious optimism among economists. We also have your full weekend forecast and a look at tonight's playoff matchups. Let's get started.",
        duration: 60,
      },
      {
        title: "Story 1",
        subtitle: "International",
        content:
          "Delegates from over one hundred and ninety countries concluded five days of talks in Geneva early this morning, signing what many are calling the most consequential climate pact in a decade. The agreement commits the top twenty emitting nations to a thirty-five percent reduction in greenhouse gases by twenty thirty-four, backed by a compliance fund of eighty billion dollars. The deal also introduces a first-of-its-kind carbon border tariff designed to prevent industries from relocating to countries with looser regulations. Environmental groups have praised the targets but warn that enforcement mechanisms remain vague. Our correspondent Maya Chen reports that the next critical milestone will be the ratification vote expected in national legislatures over the coming months.",
        duration: 120,
      },
      {
        title: "Story 2",
        subtitle: "Business",
        content:
          "Turning to the economy now, new data from the Federal Reserve shows that small-business loan approvals jumped twelve percent in the first quarter, the fastest pace of growth in nearly three years. Analysts attribute the rise to a combination of lower interest rates, expanded community bank programs, and renewed consumer spending in the services sector. Restaurant and retail startups led the charge, accounting for almost half of all new approvals. However, some experts urge caution, noting that default rates on micro-loans have also ticked upward. We spoke with three new business owners in the metro area who shared how timely credit helped them open their doors — their stories are available on our website.",
        duration: 120,
      },
      {
        title: "Sign Off",
        content:
          "That is our report for this Thursday evening. A quick reminder — you can find extended coverage of both stories, plus exclusive interviews, on our website and mobile app. Tomorrow night we will have a special segment on the tech startups reshaping public transportation. I'm Allison Grant. Thank you for watching, and we will see you right back here at six.",
        duration: 60,
      },
    ],
  },
  {
    id: "keynote-speech",
    title: "Keynote Speech",
    emoji: "🎤",
    tag: "Speech",
    tagColor: "#a78bfa",
    description:
      "A polished three-act keynote structure — hook the audience, deliver your core message, and close with a call to action.",
    sections: [
      {
        title: "Opening",
        content:
          "Thank you, and good morning. I want to start with a question that sounds simple but is deceptively hard to answer — when was the last time you changed your mind about something important? Not your lunch order or your commute route, but a belief you held deeply. Research shows that the average adult updates a core belief roughly once every seven years. Seven years. In a world that reinvents itself every few months, our thinking struggles to keep pace. Today I want to explore why that gap exists and, more importantly, what we can do about it. Because I believe the single greatest competitive advantage — for individuals and organizations alike — is the willingness to be wrong faster.",
        duration: 90,
      },
      {
        title: "Main Body",
        content:
          "Let me share a story. In twenty nineteen, our team was absolutely certain that our flagship product should move to a subscription model. Every spreadsheet confirmed it. Every consultant agreed. But one junior analyst asked a question nobody wanted to hear — what if our customers do not see themselves as subscribers? We dismissed it at first. Three months later, after a painful launch and a wave of cancellations, we realized she was right. Our users wanted ownership, not rental. That single overlooked insight cost us eleven million dollars. Here is the lesson — certainty feels productive, but it is often just comfortable. The teams that thrive are the ones that build structured doubt into their process. They run pre-mortems before launches, assign a devil's advocate in every strategy meeting, and celebrate the person who surfaces the uncomfortable truth. This is not about being indecisive. It is about being rigorous. Data without debate is just decoration.",
        duration: 180,
      },
      {
        title: "Closing",
        content:
          "So here is my challenge to each of you. Before you leave this conference, find one belief in your organization that everyone agrees on — and pressure-test it. Ask the uncomfortable question. Invite the dissenting voice into the room. You might discover that your biggest risk is not the competition or the market. It might be the assumption you have never bothered to examine. Thank you for your time today. I genuinely look forward to being proven wrong about something in the conversations ahead. Enjoy the rest of the summit.",
        duration: 60,
      },
    ],
  },
  {
    id: "vlog-intro",
    title: "Vlog Opening",
    emoji: "🎬",
    tag: "Video",
    tagColor: "#f59e0b",
    description:
      "A punchy two-section vlog opener that hooks viewers in the first ten seconds and lays out the day's plan.",
    sections: [
      {
        title: "Intro",
        content:
          "What is going on, everyone! Welcome back to the channel. If you are new here, my name is Alex and I make videos about food, travel, and occasionally doing things that terrify me — which brings us to today. I am currently standing outside a seventy-year-old train station in rural Portugal and in about ten minutes I am boarding a train with no hotel booked, no itinerary, and only a backpack. The rule is simple — wherever the train stops, I stop. Hit that subscribe button because this one is going to be wild.",
        duration: 60,
      },
      {
        title: "Today's Plan",
        content:
          "Alright, here is the loose plan. I have a forty-eight-hour window and three possible train routes heading north. Chat actually voted on which route I should take — and you guys picked the coastal line through Nazaré and Porto, so that is exactly what we are doing. Along the way I want to try at least three local dishes, find a place to sleep for under fifty euros, and — this is the stretch goal — catch a sunset from a cliff I saw in a travel forum. If I pull this off it could be the best episode yet. If I fail, well, you will get to watch that too. Let us go grab our ticket.",
        duration: 60,
      },
    ],
  },
  {
    id: "tech-review",
    title: "Tech Review",
    emoji: "📱",
    tag: "Tech",
    tagColor: "#06b6d4",
    description:
      "A structured four-part tech review covering first impressions, design, performance benchmarks, and final verdict.",
    sections: [
      {
        title: "Intro",
        content:
          "Hey everyone, welcome back. Today we are taking a deep dive into the Nova Pixel Nine Pro, which has been sitting on my desk for exactly two weeks now. I have used it as my daily driver — no backup phone, no cheating. In this review I will cover the design, the display, real-world performance, camera quality, and battery life, and at the end I will tell you whether it is worth the seven-hundred-and-forty-nine dollar price tag. Let us get into it.",
        duration: 60,
        notes: "Show product box and unboxing B-roll",
      },
      {
        title: "Design & Display",
        subtitle: "Hardware",
        content:
          "Starting with the design, Nova went with a flat titanium frame this year, and honestly it feels fantastic in the hand. The weight comes in at one hundred and eighty-seven grams which is just about perfect. On the front you get a six-point-seven-inch LTPO AMOLED panel running at one to one-twenty hertz adaptive refresh. Peak brightness hits twenty-two hundred nits, and I can confirm — outdoor readability is not an issue even in direct sunlight. Color accuracy out of the box measured a delta-E of zero-point-eight in our testing, which is about as close to reference as you can get. The bezels are thinner than last year, and the under-display fingerprint sensor is noticeably faster.",
        duration: 90,
        notes: "Specs: 6.7\" LTPO AMOLED, 2200 nits peak, titanium frame, 187 g, under-display fingerprint",
      },
      {
        title: "Performance",
        subtitle: "Benchmarks & Battery",
        content:
          "Under the hood we have the Orion 9 Gen 2 chip, eight gigs of RAM in the base model, and one-twenty-eight gigs of storage. In day-to-day use — emails, social media, multitasking with ten-plus apps — this phone never stutters. Gaming performance is equally impressive; we ran Zenith Legends at max settings and held a steady fifty-nine to sixty frames per second with only moderate thermal throttling after twenty minutes. Now battery — this is where things get really interesting. The five-thousand-milliamp-hour cell got me through a full day with roughly thirty percent left by bedtime. Screen-on time averaged about seven hours and forty minutes. Charging tops out at sixty-five watts wired, which gets you from zero to fifty in about eighteen minutes.",
        duration: 120,
        notes: "Orion 9 Gen 2, 8 GB RAM, 128 GB storage, 5000 mAh, 65 W wired charging, 7 h 40 min SOT",
      },
      {
        title: "Verdict",
        content:
          "So, final thoughts. The Nova Pixel Nine Pro is not a revolutionary leap, but it is an exceptionally well-rounded phone. The display is best in class, performance is top tier, and the battery life finally matches what flagships should deliver. The camera — which I will cover in a dedicated video — is very competitive but not quite the king of night mode. At seven forty-nine it sits right in the sweet spot below the ultra-premium tier while delivering ninety-five percent of the experience. If you are upgrading from anything two years or older, this is an easy recommendation. Drop your questions in the comments and I will answer as many as I can. Thanks for watching, and I will see you in the next one.",
        duration: 90,
      },
    ],
  },
  {
    id: "online-course",
    title: "Course Lecture",
    emoji: "📚",
    tag: "Education",
    tagColor: "#10b981",
    description:
      "A three-part lecture flow — review previous material, introduce the new topic, and wrap up with Q&A prompts.",
    sections: [
      {
        title: "Review",
        content:
          "Welcome back, everyone. Before we dive into today's topic, let us do a quick recap of last week's session. We covered the fundamentals of supply and demand — specifically, how price signals coordinate decisions between buyers and sellers without any central planner. Remember the key takeaway: when the price of a good rises, quantity demanded tends to fall and quantity supplied tends to rise, all else being equal. We also looked at two real-world case studies — ride-share surge pricing and seasonal produce markets. If any of that feels fuzzy, I strongly recommend reviewing the chapter four summary before next week's quiz. Any quick questions before we move on?",
        duration: 90,
      },
      {
        title: "New Topic",
        subtitle: "Market Equilibrium",
        content:
          "Great. Today we are tackling market equilibrium — the point where supply and demand intersect. This is one of the most important concepts in introductory economics because it explains how markets settle on a price and quantity without anyone dictating the outcome. Let me draw this on the board. On the vertical axis we have price, on the horizontal we have quantity. The demand curve slopes downward, the supply curve slopes upward, and where they cross — that is equilibrium. At this point, the quantity buyers want to purchase exactly matches the quantity sellers want to produce. Now, what happens when the market is not at equilibrium? If the price is above equilibrium, we get a surplus — sellers have more inventory than buyers want. If the price is below equilibrium, we get a shortage — buyers are scrambling and sellers run out of stock. The market naturally corrects: surplus pushes prices down, shortage pushes prices up, and we drift back toward equilibrium. This self-correcting mechanism is what Adam Smith famously called the invisible hand.",
        duration: 180,
      },
      {
        title: "Q&A Wrap-up",
        content:
          "Alright, let us pause here for questions. I know equilibrium can feel abstract, so do not hesitate to ask even if you think it is basic. While you are thinking, let me give you the assignment — read chapter five, sections one through three, and work through the two practice problems at the end. We will start next class by reviewing those problems together. Also, remember that office hours are Thursday from two to four. If you are struggling with the graphing portion, that is the perfect time to come in and work through examples with me. Great session today, everyone. See you next week.",
        duration: 60,
      },
    ],
  },
];
