# Corvioz Quote & Production Intelligence Product Model v0.1
## 基于创始人实战经验 + 北美/英国公开行业证据的交叉验证稿

**文档语言：** 中文  
**文档类型：** Product Direction / Domain Model / Architecture Input  
**状态：** EVIDENCE-BACKED DESIGN INPUT  
**Implementation Authority：** NO  
**Current Mainline Impact：** NONE  
**用途：** 提供给 Corvioz 主线，在当前工程主线收口后判断 Quote / Package / AI Intelligence 下一阶段如何吸收。  
**重要原则：** 本文不把创始人个人经验直接当成全球摄影行业规则。所有结论区分为「外部事实」「区域/个人经验」「产品推导」「待验证假设」。

---

# 1. 结论摘要

经过本轮讨论与外部资料交叉验证，Corvioz 的下一阶段产品方向可以进一步明确为：

> **Corvioz 不只是摄影师的 Quote / Invoice 工具。**
>
> **Corvioz 应逐步成为独立摄影师的 AI Business Producer（AI 商务制片 / 业务制片）。**

原有定位并不需要推翻：

> **Scope clarity before quote.**  
> **State clarity after quote.**

新的 AI Business Producer 定位是在其上增加一层：

> **Understand → Decide → Execute**

- **Understand：** 理解客户 Brief、识别项目类型、量化模糊需求。
- **Decide：** 判断缺失信息、生产依赖、风险、资源配置、预算与商业权利。
- **Execute：** 形成 Internal Budget、Client-facing Quote、后续 Scope Change / Approval / Invoice / Payment 动作。

本轮外部验证总体结论：

```text
CORE_DIRECTION=SUPPORTED
GLOBAL_SINGLE_PRICING_RULEBOOK=REJECT
PHOTOGRAPHY_DOMAIN_LAYER=SUPPORTED
PERSONAL_PRICING_BASELINE=SUPPORTED_AS_PRODUCT_DIRECTION
REGIONAL_MARKET_LAYER=REQUIRED
INTERNAL_BUDGET_DETAIL=SUPPORTED
CLIENT_QUOTE_ALWAYS_AGGREGATED=NOT_SUPPORTED_AS_UNIVERSAL_RULE
USAGE_AS_BUSINESS_VARIABLE=STRONGLY_SUPPORTED
BRIEF_TO_SCOPE_BEFORE_QUOTE=STRONGLY_SUPPORTED
SCOPE_CHANGE_REQUIRES_COMMERCIAL_REVIEW=SUPPORTED
LLM_AS_SOURCE_OF_TRUTH=NO
MARKET_RATE_ENGINE_NOW=DEFER
```

---

# 2. 证据等级

本文使用四级证据标签：

### [E1] 强外部证据
来自：
- 专业行业协会当前资料；
- 政府/机构公开 RFP / Tender；
- 公开商业摄影合同 / Estimate / Invoice 样例；
- 当前专业行业教育资料。

### [E2] 中等外部证据
来自：
- 较早但仍有参考价值的专业协会文章；
- 单个专业摄影师的公开实践案例；
- 历史行业样例。

### [F] Founder Experience
来自创始人在上海/中国商业摄影、食品摄影、品牌拍摄、企业活动中的真实经历。

这些经验是真实产品研究输入，但不能自动提升为全球规则。

### [H] Hypothesis
产品团队根据事实和经验做出的推导，需要真实 Corvioz 用户进一步验证。

---

# 3. 已交叉验证的外部来源

## 美国

### Professional Photographers of America (PPA)
2026 年最新 Commercial Photography 系列明确将商业摄影描述为：

- client communication
- creative brief / statement of work
- deliverables
- timelines
- usage licensing
- production budgeting
- pre-production
- crew / casting / location / catering / call sheet
- client feedback
- post-production
- revisions
- final delivery

Sources:

- https://www.ppa.com/photovision/watch/commercial-photography-explained-from-first-contact-to-final-delivery
- https://www.ppa.com/photovision/watch/the-commercial-photography-bidding-and-production-process
- https://www.ppa.com/photovision/watch/commercial-photography-pre-production-workflow
- https://www.ppa.com/photovision/watch/commercial-photography-production-post-production-workflow
- https://www.ppa.com/photovision/watch/commercial-photography-contracts-usage-and-client-agreements

### American Society of Media Photographers (ASMP)
公开 Licensing Guide、Paperwork Share 与 Terms & Conditions 中存在大量真实 Estimate / Invoice 结构：

- Creative / Photography Fee
- Usage / Licensing
- Pre-production
- Assistant
- Casting
- Talent
- Makeup
- Wardrobe
- Food Stylist
- Production Assistant
- Project Management
- Props
- Digital Services
- Travel / Mileage / Meals
- Reshoots / Overtime / additional changes

Sources:

- https://www.asmp.org/strictly-business-blog/establishing-the-fee/
- https://www.asmp.org/paperwork-share/studio-portraits-brian-beaugureau/
- https://www.asmp.org/paperwork-share/state-park/
- https://www.asmp.org/paperwork-share/product-labels-brian-beaugureau/
- https://www.asmp.org/licensing-guide/terms-conditions/
- https://www.asmp.org/strictly-business-blog/change-order-forms/
- https://www.asmp.org/strictly-business-blog/budgets/

---

## 加拿大

### CAPIC — Canadian Association of Professional Image Creators

CAPIC 当前仍维护：

- Licensing Fee Schedule
- National Pricing Survey
- Digital Photographic Production and License Agreement
- Model / Property agreements

并在 2025 Licensing & Production Fee Survey 中继续采集加拿大专业创作者真实市场数据。

Sources:

- https://capic.org/pricing-your-work
- https://capic.org/news/why-updating-the-licensing-fee-schedule-matters-for-canadian-image-creators
- https://stage.capic.org/forms/

---

## 加拿大真实活动 RFP

Canadian Country Music Association 的 Event Photography / Video Content Creation RFP 明确要求：

- pre-event consultation
- shot list / content plan
- sponsor coverage
- red carpet / stage / backstage
- 2–3 小时内编辑图像
- live / immediate photography feed
- post-event approval
- 团队自行提出 approach、cost breakdown 与 number of team members

Source:

- https://ccma.org/request-for-proposal-event-photography-videography-and-content-creation-services/2024/07/

---

## 英国

VisitBritain / VisitEngland 的公开 Production Professionals Tender 显示大型摄影 Brief 可能涉及：

- Producer
- Art Director
- Stylist
- models / cast
- locations / permits
- travel / accommodation
- casting
- releases
- risk assessments
- photographer assistants
- tethered client review

Source:

- https://www.find-tender.service.gov.uk/Notice/022135-2021

---

# 4. 产品核心模型

建议 Corvioz 将摄影项目理解为：

```text
Raw Client Brief
      ↓
Interpret
      ↓
Quantify
      ↓
Structured Scope
      ↓
Execution Strategy
      ↓
Production Dependencies
      ↓
Internal Budget
      ↓
Client-facing Estimate / Quote / Bid
      ↓
Usage / Licensing
      ↓
Negotiation
      ↓
Production
      ↓
On-set Changes / Approval
      ↓
Post-production / Revision / Reshoot
      ↓
Delivery
      ↓
Outcome / Learning
```

此模型与 PPA 2026 年商业摄影工作流、ASMP 商业 Estimate 案例总体一致。[E1]

---

# 5. Brief ≠ Quote-ready Scope

## 5.1 Founder Experience [F]

商业摄影客户即使提供 Brief，也可能只写：

- 6 个画面；
- 12 张照片；
- 某种背景方向。

但仍然缺少：

- 横版 / 竖版分配；
- 产品 / SKU 数；
- 每个 setup 对应几张；
- final image count；
- 使用场景；
- 是否人物；
- 是否需要 styling / props / set；
- 后期复杂度。

## 5.2 外部验证 [E1]

PPA 2026 Commercial Photography Bidding & Production Process 明确将 creative brief、statement of work、shot list、deliverables、timeline、usage、production planning 作为正式报价/竞标前的重要组成部分。

因此 Corvioz 应采用：

> **Brief → Quantified Scope → Estimate / Quote**

而不是：

> **Brief → AI 直接吐一个价格**

---

# 6. Brief Maturity / Quote Readiness

建议产品内部区分：

### Level 1 — Intent
只知道客户大概想拍什么。

### Level 2 — Rough Brief
有初步数量和方向，但关键变量没有量化。

### Level 3 — Quantified Brief
主体数量、最终交付数量、画幅、主要场景等已明确。

### Level 4 — Estimate Ready
已经足够形成有假设条件的初步预算。

### Level 5 — Final Quote Ready
核心 Production、Usage、交付和责任边界已明确。

### Level 6 — Production Ready
人员、场地、时间、供应商、call sheet / shot list 等已经可以执行。

**Evidence status：**  
整体层级是 Corvioz 的产品推导 [H]；“商业摄影需要从 Brief → Scope → Production Planning”有强外部支持 [E1]。

---

# 7. Preliminary Estimate 与 Final Quote 应区分

Founder 实践表明，客户初期经常只需要知道：

> “大概要多少钱？”

只要最低 Scope 足够，就可以给初步 Estimate；但必须写明假设与 exclusions。

示例：

```text
Preliminary Estimate: ¥30,000

Based on:
- 1 shoot day
- 5–6 final images
- simple studio production
- standard retouching

Not included:
- talent
- wardrobe
- advanced compositing
- expanded usage
```

当后续增加 Talent、AI Background、KV compositing 等真实工作时，Estimate 应升级为 Revised Estimate，而不是覆盖原记录。

建议：

```text
ESTIMATE_VERSION_HISTORY=YES
SCOPE_DELTA_TRACKING=YES
```

外部支持：
ASMP Paperwork Share 中大量存在 Estimate → Revised Estimate → Final Invoice 的真实样例。[E1]

---

# 8. Internal Budget 与 Client-facing Quote

这是本轮最重要的产品发现之一。

## 8.1 Internal Budget

摄影师内部需要足够细：

### Creative / Professional Labor
- Photographer
- Producer
- Assistant(s)
- Art / Set
- Stylist
- Food Stylist
- Retoucher

### Talent
- Actor / Model
- Casting
- Makeup / Hair
- Wardrobe
- Fitting
- Usage / talent buyout where applicable

### Production
- Studio
- Location
- Lighting
- Camera
- Equipment
- Set build
- Props

### Materials
- Food ingredients
- consumables
- production materials

### Logistics
- Travel
- Transport
- Parking
- Accommodation
- Meals / catering

### Support
- Production Assistant / Runner / General Production Support

### Commercial Layer
- Photographer fee
- Production / management margin
- contingency
- concession / discount
- hard cost
- target margin

ASMP 的公开真实 Estimate 中可以看到几乎全部上述类别。[E1]

特别是 Food Photography 实例：

- Food Stylist 单列；
- Groceries 另计；

这直接支持：

> **专业人员费用和其材料 / 采购成本不应被视为同一项。**

---

# 9. “自己做”不等于成本不存在

Founder Experience [F]：

摄影师早期常自己承担：

- producer
- props
- set
- purchasing
- coordination

因此账面 cash cost 下降，但工作量与风险没有消失。

建议 Corvioz 内部允许：

```text
ROLE=Producer
PERFORMED_BY=Photographer
CASH_COST=0
INTERNAL_WORKLOAD=YES
```

这是产品推导 [H]，外部资料能够证明 Producer / Project Management / Production Assistant 本身是正常商业制作角色 [E1]，但“如何给摄影师自己的隐性劳动定价”仍需真实用户验证。

---

# 10. Requirement → Dependency → Cost

不要做“100 项摄影报价 Checklist”。

应做动态依赖。

示例：

```text
Talent
→ Casting
→ Makeup
→ Wardrobe
→ Fitting
→ Usage / release
```

```text
Food Production
→ Food Stylist
→ Ingredients
→ Prep
```

```text
Complex Production
→ Producer
→ Assistants
→ Production Support
```

PPA 2026 Pre-production Workflow 与 ASMP Estimate 样例均支持这些角色/依赖真实存在。[E1]

Corvioz 的具体触发算法属于 [H]。

---

# 11. Production Complexity

建议不是按“项目金额”判断是否上人员，而是按复杂度：

### Coordination Complexity
影响：
- Producer

可能变量：
- 多部门；
- talent；
- wardrobe / makeup；
- 多供应商；
- catering / travel；
- 时间控制；
- 多个 client stakeholders。

### Technical Complexity
影响：
- Photography Assistant 数量

可能变量：
- lighting count；
- equipment volume；
- setup changes；
- set/background changes。

### Operational Complexity
影响：
- Production Support / Runner

可能变量：
- 搬运；
- reset；
- general logistics；
- 餐饮；
- non-specialized production labor。

PPA 当前商业摄影 Pre-production 教程明确讨论 producer、crew hiring、casting、equipment、catering、call sheets、overtime planning。[E1]

具体阈值（例如“6–8 盏灯就第二助理”）目前只能视为 Founder Experience [F]，不能写成全球硬规则。

---

# 12. Event Photography 与 Commercial Production 不应共享完全相同的 staffing 规则

Founder Experience [F]：

上海企业活动询盘中，客户 / 活动执行方经常会直接指定：

- photographer count
- video camera count
- service days

但外部活动 RFP 显示另一种真实模式：

客户给：
- coverage scope
- red carpet / stage / backstage
- same-day delivery
- live feed

供应商再提出：
- approach
- team size
- cost

因此：

```text
CLIENT_REQUIREMENT
≠
CORVIOZ_RECOMMENDATION
```

产品规则：

1. 客户已经明确人员数量 → Corvioz 保留。
2. 客户没有明确 → 可以帮助摄影师形成 staffing proposal。
3. 客户要求与 coverage 明显冲突 → Corvioz 只提示 conflict，不擅自改变客户 Scope。

例如：

```text
Client says:
1 Photographer

Brief contains:
3 simultaneous rooms

Corvioz:
Coverage conflict detected.
Confirm priority or additional photographer.
```

此逻辑有加拿大 CCMA RFP 与英国公开采购结构支持。[E1]

---

# 13. Event 的 Live Photo / Same-day Delivery 是独立服务模式

创始人真实报价案例：

《活动定机位视频录制＋图片直播报价单》内部实际包含：

- 摄影师
- 相机设备
- 远程修图师
- 图片直播平台
- 实时传输设备
- 8 小时基础服务
- overtime
- 机位 / 人员 / 交付变化重新确认费用

这说明：

> “活动摄影”与“活动图片直播”不是同一成本模型。

加拿大 CCMA 真实 RFP 同样明确要求：

- 2–3 小时内专业编辑图像；
- red carpet live / immediate turnaround；
- 实时社媒内容。

因此建议：

```text
EVENT_SERVICE_MODE:
STANDARD_COVERAGE
LIVE_PHOTO
SAME_DAY
RUSH
```

不同模式动态触发相关 Production Dependencies。[E1 + F]

---

# 14. Unknown Budget 与 Known Budget 必须分开

## Unknown Budget

现实中摄影师通常不知道客户实际预算。

这时：

> 根据 Scope + Production + Personal Baseline 形成正常 Estimate。

## Known Budget

如果客户或 art buyer 明确给出预算：

> 才进入 Budget Reconciliation。

ASMP 的专业摄影师公开实践明确提到，会询问 art buyer 的预算；如果客户愿意透露，预算可帮助判断是否值得提交 Estimate，以及定价起点。[E2]

因此建议 Corvioz 建立两个不同状态：

```text
BUDGET_KNOWN=NO
→ Build normal estimate

BUDGET_KNOWN=YES
→ Compare scope economics vs client budget
```

---

# 15. Scope 固定、Budget 下降时，不应假装 Scope 改了

如果：

- scenes 不变；
- deliverables 不变；
- production requirement 不变；

但预算从 180k → 100k，

真正变化的是：

- margin；
- supplier strategy；
- risk buffer；
- photographer concession；
- photographer self-performed labor；
- strategic subsidy。

建议内部区分：

```text
STANDARD_PRICE
TARGET_PRICE
OFFERED_PRICE
HARD_COST
ECONOMIC_FLOOR
CONCESSION
STRATEGIC_VALUE
```

这部分属于 Corvioz 产品推导 [H]。

外部 ASMP 资料支持：

- 商业 Estimate 会考虑 overhead、assignment complexity、usage、client、location、历史类似报价；
- 谈判时可能根据预算调整；
- photographer fee 不应是唯一可分析变量。[E2]

---

# 16. Internal Quote 细、Client Quote 是否必须聚合？

本轮外部验证对我们的原始想法进行了重要修正。

原始 Founder / Product Hypothesis：

> 内部非常细；对外 Production House 风格，只显示 3–5 个大类。

外部事实：

### 真实市场存在高度明细 Client Estimate
ASMP 多份公开商业 Estimate 直接向客户展示：

- Photography
- Assistant
- Casting
- Talent
- Makeup
- Wardrobe
- Food Stylist
- Digital Services
- Production Assistant
- Project Management
- Props

### 也存在更聚合的报价方式
PPA 商业摄影实践中，有摄影师向 agency 只给较聚合的 fee / expenses，也有人给高度明细的 prep / shooting / post / licensing。

因此正确产品结论不是：

> “客户一定只能看大类。”

而是：

> **Internal Budget 永远保留细颗粒度；Client-facing Quote 支持可配置 Grouping / Disclosure。**

建议：

```text
INTERNAL_DETAIL=ALWAYS_AVAILABLE

CLIENT_VIEW:
GROUPED
DETAILED
CUSTOM
```

这是比原始假设更可靠的产品方向。[E1]

---

# 17. Photographer Mode vs Production Mode

仍然建议保留这个产品概念，但它是 [H]，不是行业标准名称。

### Photographer Mode
适合：
- 简单 event；
- portrait；
- small restaurant；
- straightforward assignment。

报价可能围绕：
- photographer
- assistant
- equipment
- retouch
- travel

### Production Mode
适合：
- advertising
- KV
- talent
- styling
- set
- complex commercial production

内部预算覆盖完整 Production。

外部 PPA / ASMP 资料强烈支持大型商业摄影存在完整 Production Budget，而不仅是 photographer day rate。[E1]

---

# 18. Usage / Licensing 必须成为独立 Business Variable

这是外部证据最强的一块。

ASMP Licensing Guide 明确建议授权至少回答：

- Who uses the images?
- How / where?
- How long?

并指出：
- photography fee 常包含 Creative / Production Fee；
- License Fee；
- Expenses；
- 有些摄影师会把 Production + License 合并成 umbrella creative fee。

PPA 当前商业合同指导也要求明确：

- how images may be used；
- for how long；
- media；
- copyright / licensing。

加拿大 CAPIC 仍维护 Licensing Fee Schedule 和 Production / License Agreement。

因此：

```text
USAGE_TRACKING=REQUIRED_DOMAIN_CONCEPT
USAGE_MUST_ALWAYS_BE_SEPARATE_LINE_ITEM=NO
```

建议字段：

```text
Media
Territory
Duration
Exclusivity
Pricing Treatment:
- Included
- Separate fee
- To negotiate
- Special agreement
```

---

# 19. Base Quote 可包含有限授权，但必须定义边界

Founder 新策略：

> Base Production Quote 包含一个合理、有限的 Usage Scope；
> 如果客户需要更长时间、更大地域、更广媒体，再谈扩展。

外部 ASMP / PPA 对“明确使用范围、后续额外使用另行协商”有明确支持。[E1]

但：

> “默认一年授权一定最合理”

没有全球事实支持。

因此 1 年只能作为：
- 用户模板；
- 市场/个人习惯；

不能是 Corvioz 全球硬编码。

---

# 20. Estimate vs Bid 不是同一语义

ASMP 明确指出：

### Estimate
预计项目成本；
最终 invoice 可以根据真实发生费用变化。

### Bid
通常是固定价格；
即使实际超支，供应商也可能需要承担差额。

因此 Corvioz 长期 Domain Model 应至少理解：

```text
ESTIMATE
BID
QUOTE
```

第一版 UI 不一定立刻做三个不同对象，但 Intelligence 不能假设三者完全相同。[E1]

---

# 21. Client 说“贵”时，不应该自动 Discount

Founder Experience [F]：

客户说贵，可能是：

- 有更低 competing quote；
- 总预算不足；
- 没理解 Production 内容；
- 正常采购压价。

建议 Corvioz 做：

```text
PRICE_OBJECTION_DIAGNOSIS
```

候选原因：

```text
Budget mismatch
Comparable bid
Value not understood
Procurement negotiation
Unknown
```

然后检查 Internal Budget：

```text
Hard Cost
Flexible Cost
Margin / Buffer
```

输出动作：

```text
Explain
Optimize
Concede
Hold
```

ASMP 的预算与谈判文章支持：

- 可以主动询问预算；
- 应在预算变化发生时及时讨论；
- 降自己的 fee 应该是最后选择之一；
- project change 应确认额外成本。[E2]

具体“诊断四分类”为 Corvioz 产品推导 [H]。

---

# 22. Scope Change：时间点很重要

建议区分：

### Pre-quote requirement
报价前提出：
> 属于 Scope Definition。

### Minor On-set Adjustment
拍摄现场小调整：
- 换一道菜；
- 换小道具；
- 在不明显增加人员、时间、成本、交付情况下调整。

可能被摄影师作为正常服务弹性吸收。[F]

### Material Scope Expansion
如果改变：
- responsibility；
- external cost；
- production time；
- crew；
- complexity；
- deliverables；

则应进入 Commercial Review。

ASMP Terms & Conditions 明确写明：
原 Assignment 之外的 subsequent changes / additions / variations 可能需要 additional compensation。[E1]

ASMP Change Order 资料进一步建议：
拍摄中发生项目变化，应更新金额，并由有权限的人确认额外费用。[E2]

---

# 23. Revision、Additional Post、Reshoot 必须分开

### Normal Retouching
在已经确认的视觉方向内：
- color / contrast；
- cleanup；
- blemish；
- standard commercial finishing。

### Additional Post-production
- 新背景设计；
- 大型 compositing；
- 新增设计元素；
- 原 Scope 之外的复杂处理。

PPA 合同指导明确建议写清：
- retouching level；
- proofing rounds；
- deliverables；
- scope creep。

PPA 的公开案例也区分 simple retouching 与 extensive retouching，后者可按图额外收费。[E1/E2]

### Reshoot
需要重新摄影。

ASMP Terms & Conditions 进一步说明：
reshoot 的费用责任与原因有关；client-requested reshoot、第三方/不可抗因素导致的 reshoot 在费用处理上可以不同。[E1]

**注意：**
这是美国专业协会模板实践，不应直接作为全球法律规则；Corvioz 应把它作为 Business State / Discussion Trigger，而不是自动法律结论。

---

# 24. Approval Authority

Founder Practice [F]：

商业棚拍现场如果客户多人意见冲突：

> 摄影师不替客户决定；
> 客户内部先统一意见；
> 明确后再继续拍摄。

外部支持：

- PPA 当前 Production Workflow 明确讨论 on-set client feedback / collaboration；
- ASMP Terms & Conditions 规定 Client 应受其代表作出的 approvals / job changes 约束；
- ASMP Change Order 建议确认签署变更的人拥有批准额外费用的 authority。

因此产品应区分：

```text
FEEDBACK
≠
APPROVED_DIRECTION
```

并区分：

```text
QUOTE_APPROVAL
ON_SET_CREATIVE_APPROVAL
FINAL_DELIVERY_APPROVAL
```

“多人意见冲突时必须暂停拍摄”是 Founder Practice [F]，不能作为全球硬规则；但 Corvioz 可以提示：

> Conflicting client direction detected. Confirm final decision authority.

---

# 25. Production 时间也是成本

Founder Experience [F]：

- Food Stylist 有独立 preparation cycle；
- 摄影速度快并不代表整体 Production throughput 快；
- Client 现场讨论也会消耗 studio / crew / talent 时间。

PPA Pre-production / Production Workflow 对：
- schedules
- crew
- talent
- overtime
- client collaboration

有明确支持。[E1]

因此产品可以逐步建立：

```text
Preparation Time
Styling Time
Lighting / Setup Time
Capture Time
Client Approval Time
Reset Time
```

进一步推导：

> Production duration 应考虑 bottleneck，而不是只看 photographer capture speed。[H]

---

# 26. Overtime 应是独立结构

Founder Experience：
不同岗位可能有 overtime；Food Stylist 等专业人员存在 1.5x 等超时规则。

ASMP Terms & Conditions 样例明确使用：

> 超过 8 小时后，crew overtime 可能按 1.5 倍费率。

因此建议 schema 能表达：

```text
base_rate
included_hours
overtime_rate
overtime_multiplier
minimum_booking
```

但：
具体倍率必须按供应商、合同、地区和用户规则决定，不能全球硬编码 1.5。[E1 + F]

---

# 27. Personal Pricing Baseline

Corvioz 可以让用户导入过去：

- Quotes
- Invoices
- PDFs
- spreadsheets
- Corvioz projects

提取：

```text
Normal photographer fee
Common crew rates
Retouching
Overtime
Deposit
Payment terms
Project types
Client types
Concession history
Win / loss history
```

然后让用户确认。

外部 ASMP 专业摄影师实践明确提到：
估价会参考自己过去类似项目 / 类似客户的历史收费。[E2]

因此：

```text
PERSONAL_HISTORY_AS_INPUT=SUPPORTED
```

具体自动学习方式属于 Corvioz 产品/架构设计 [H]。

---

# 28. Market Intelligence 必须后置

未来可以研究：

```text
Region
Client segment
Photography type
Production scale
Usage
Photographer positioning
```

再形成价格分布。

加拿大 CAPIC 的 National Pricing Survey 与 Licensing Fee Schedule 证明：
市场价格数据可以通过专业创作者调查形成。[E1]

但 Corvioz 当前没有自己的足够样本。

因此当前必须：

```text
VERIFIED_MARKET_DATA=INSUFFICIENT
MARKET_PRICE_CLAIMS=NO
```

禁止 AI 无数据时说：

> “California photographers normally charge $X。”

优先语言：

> Based on your historical pricing...
> Based on this project's scope...
> Based on verified market data...（只有未来有真实数据时）

---

# 29. Regional Knowledge Layer 是必要的

本轮验证明确看到：

- 美国 PPA / ASMP 体系；
- 加拿大 CAPIC pricing / licensing；
- 加拿大 Event RFP；
- 英国公开 production tender；

在：
- terminology
- procurement
- licensing
- staffing
- compliance
- estimate structure

上存在差异。

因此 Corvioz 不应该建立：

> Global Photography Pricing Rulebook

而应该建立：

```text
Universal Production Logic
+
Photography Type Rules
+
Regional / Market Rules
+
Photographer Personal Rules
+
Current Client / Project Context
```

这也是 AI Business Producer 可扩展全球市场的重要架构原则。

---

# 30. AI Intelligence 架构原则

> **Corvioz knows photography. The model helps Corvioz reason.**

LLM 不应成为：

- price source of truth；
- tax calculator；
- entitlement authority；
- payment state authority；
- market-rate database；
- legal decision engine。

建议：

```text
Domain Rules
+
User Business Profile
+
Project Facts
+
Relevant Historical Data
+
Verified Market Data (future)
       ↓
Corvioz Intelligence Layer
       ↓
LLM reasoning
       ↓
Findings / Suggestions / Actions
       ↓
Deterministic Core System
```

---

# 31. 第一阶段最值得开发的 Intelligence

本轮研究以后，第一阶段比之前更清楚：

## Quote / Pre-send Intelligence v1

输入：

- raw brief / structured project；
- client requirement；
- current quote；
- user confirmed business baseline；
- relevant photography-type rules。

输出：

### Brief / Scope
- missing information
- unquantified requirements
- contradictions
- estimate readiness

### Production
- dependencies
- crew/resource checks
- possible missing costs

### Commercial
- Usage missing
- overtime missing
- deliverable ambiguity
- revision ambiguity
- scope / responsibility conflict

### Client Requirement vs Corvioz Recommendation
必须视觉区分。

明确不做：

```text
AUTHORITATIVE_MARKET_PRICE
AUTONOMOUS_FINAL_PRICE
UNVERIFIED_REGIONAL_RATE
AUTOMATIC_LEGAL_DECISION
```

---

# 32. 第二阶段：Personal Pricing Intelligence

在用户有历史后：

- comparable past projects；
- normal rate range；
- historical concessions；
- win/loss；
- project profitability；
- commonly forgotten items。

输出重点：

> “你过去类似项目通常怎么做。”

不是：

> “全世界摄影师应该怎么做。”

---

# 33. UI 原则

报价 UI 应显式表达两个空间：

## Internal Planning / Business View

摄影师自己看：

- detailed costs
- roles
- resources
- hard cost
- margin
- concessions
- risk
- internal workload
- dependencies

## Client Presentation

客户看到：

- production scope
- deliverables
- selected cost grouping
- usage
- commercial terms

Client View 支持：

```text
Grouped
Detailed
Custom
```

而不是硬编码“客户只能看 4 项”。

---

# 34. 建议的数据概念（非最终 schema）

```text
ProjectType
ClientSegment
Region
ProcurementType

Brief
BriefMaturity
Requirement
Deliverable
Subject / SKU
Setup / Scene
AspectRatio
Usage

ExecutionStrategy
ProductionDependency
CrewRole
Supplier
Resource

InternalCostItem
CashCost
InternalWorkload
Margin
RiskBuffer
Concession

Estimate
EstimateVersion
Quote
Bid
ClientFacingGroup

ScopeChange
ChangeReason
Revision
AdditionalPost
Reshoot

ApprovalType
Feedback
ApprovedDirection

Outcome
Won
Lost
Stalled
LossReason
```

此处为产品架构输入 [H]，不是 implementation authority。

---

# 35. 哪些结论不能写成全球硬规则

本轮特意排除以下错误：

```text
“500人活动一定需要2个摄影师”
NO

“6–8盏灯一定需要2个助理”
NO — founder heuristic only

“商业摄影客户侧报价一定只能显示3–5项”
NO

“1年Usage是全球标准默认授权”
NO

“摄影师自己的day rate永远不能变化”
NO

“客户说贵就应该discount”
NO

“永久授权一定应该加固定百分比”
NO

“Production House一定采用某一种统一报价格式”
NO
```

这些只能作为：
- 用户模板；
- 区域规则；
- heuristic；
- 未来市场数据结论。

---

# 36. 当前最重要的产品原则

```text
1. BRIEF_IS_NOT_SCOPE

2. QUANTIFY_BEFORE_FINAL_QUOTE

3. REQUIREMENT_CREATES_DEPENDENCIES

4. INTERNAL_DETAIL_AND_CLIENT_PRESENTATION_ARE_DIFFERENT_CONCERNS

5. CLIENT_REQUIREMENT_AND_AI_RECOMMENDATION_MUST_BE_SEPARATED

6. USAGE_IS_PART_OF_COMMERCIAL_SCOPE

7. SCOPE_CHANGE_REQUIRES_COMMERCIAL_REVIEW

8. PERSONAL_HISTORY_IS_MORE_TRUSTWORTHY_THAN_FAKE_MARKET_AVERAGES

9. REGIONAL_RULES_MATTER

10. LLM_DOES_NOT_OWN_BUSINESS_TRUTH
```

---

# 37. 对当前主线的建议

```text
DOCUMENT_ROLE=
EVIDENCE_BACKED_PRODUCT_INPUT

CURRENT_MAINLINE_IMPLEMENTATION_AUTHORITY=
NO

RECOMMENDATION=
ABSORB_WHEN_CURRENT_QUOTE / PACKAGE / INTELLIGENCE MAINLINE REACHES APPROPRIATE DESIGN GATE

FIRST_RUNTIME_CANDIDATE=
QUOTE_REVIEW / PRE_SEND_INTELLIGENCE

INTERNAL_BUDGET_MODEL=
HIGH_PRIORITY_DESIGN_INPUT

CLIENT_FACING_GROUPING=
SUPPORT_CONFIGURABLE_PRESENTATION

PERSONAL_PRICING_BASELINE=
PLAN_AFTER_CORE_INTELLIGENCE

REGIONAL_MARKET_PRICING=
DEFER

AUTONOMOUS_PRICE_ENGINE=
NO
```

主线应根据当时真实代码 / schema / Quote Package 进度决定：

- 哪些概念现在吸收进数据模型；
- 哪些仅预留；
- 哪些完全后置。

不应因为本文重新开启一条与当前主线竞争的大型工程。

---

# 38. 仍需真实用户验证的问题

虽然外部资料支持核心结构，但以下仍未被 Corvioz 用户验证：

1. 摄影师是否愿意维护 Detailed Internal Budget？
2. Internal → Client Grouping 是否明显提高报价效率？
3. AI 缺项提醒是否真的减少漏报？
4. 用户是否愿意导入历史 Quote 建立 Personal Baseline？
5. Photographer Mode / Production Mode 是否是用户容易理解的分类？
6. Brief Maturity 是否应该直接呈现在 UI？
7. 用户最希望 AI 在哪个时间点介入？
8. 哪些提醒最容易变成噪音？
9. Usage 提醒是否对非广告摄影师造成负担？
10. Regional Rules 应自动判断还是用户显式选择？

这些必须通过真实摄影师使用数据决定。

---

# 39. 最终产品定义（当前研究版）

> **Corvioz is an AI Business Producer for photographers.**

它不是替摄影师凭空决定市场价。

它应该：

> 理解客户在说什么；
>
> 把模糊 Brief 变成可以执行的 Scope；
>
> 识别完成 Scope 所需的人、资源、时间与商业权利；
>
> 帮摄影师建立真实的内部经营预算；
>
> 再把内部复杂度转换成客户能理解的 Estimate / Quote；
>
> 在需求变化、谈判、修改、重拍与交付过程中持续维护项目真值；
>
> 并随着摄影师自己的历史数据积累，越来越了解这个摄影师是怎么做生意的。

长期护城河不是：

> “Corvioz 接了一个 AI 模型。”

而是：

> **Photography Domain Knowledge**
> +
> **Regional Business Knowledge**
> +
> **Photographer Personal Business History**
> +
> **Real Workflow State**
> +
> **Action Execution**

---

# 40. Research Boundary

本文不是法律、税务或行业统一价格标准。

尤其以下内容必须持续按地区验证：

- copyright / work-for-hire；
- licensing legal language；
- cancellation；
- reshoot liability；
- overtime labor rules；
- tax；
- talent usage；
- insurance；
- regional commercial customs。

Corvioz 应做：

> structure / detect / remind / explain / track

而不是在缺少专业法律或真实市场 authority 时自动作出法律与市场价格结论。

---

## Document Status

```text
CORVIOZ_QUOTE_PRODUCTION_INTELLIGENCE_MODEL_V0_1=
COMPLETE

FOUNDER_INPUT=
INCLUDED

US_EXTERNAL_VALIDATION=
INCLUDED

CANADA_EXTERNAL_VALIDATION=
INCLUDED

UK_EXTERNAL_VALIDATION=
INCLUDED

EVENT_CASE_VALIDATION=
INCLUDED

COMMERCIAL_ADVERTISING_VALIDATION=
INCLUDED

IMPLEMENTATION_AUTHORITY=
NO

READY_FOR_MAINLINE_REVIEW=
YES
```
