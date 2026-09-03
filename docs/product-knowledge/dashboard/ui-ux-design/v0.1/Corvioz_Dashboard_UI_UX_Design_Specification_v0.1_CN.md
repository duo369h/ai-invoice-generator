# Corvioz Dashboard UI / UX Design Specification v0.1
## 主线吸收版｜基于现有 Dashboard、Studio Ninja 对比与创始人实机反馈

**文档语言：** 中文  
**文档类型：** UI/UX Design Input / Information Architecture / Interaction Specification  
**状态：** DESIGN INPUT  
**Implementation Authority：** NO  
**Current Mainline Impact：** NONE  
**用途：** 提供给 Corvioz 主线，在不打断当前工程主线的前提下，作为后续 Dashboard / Quote Workspace / Navigation / Settings / Client-facing Preview 优化依据。

---

# 1. 核心目标

Corvioz 的 Dashboard 不应发展成传统 SaaS 式的“功能目录”。

目标应是：

> **Dashboard 负责聚焦。**  
> **Project / Quote Workspace 负责工作。**  
> **Detail 负责复杂度。**  
> **Preview 负责客户输出。**  
> **Settings 负责低频配置。**  
> **Intelligence 在正确的位置出现，而不是占据一个独立世界。**

核心体验目标：

> **Complexity stays with Corvioz. Focus stays with the photographer.**

用户第一次进入系统，在没有 tooltip、onboarding、AI 对话框提示的情况下，也应能快速理解：

- 当前有什么需要处理；
- 自己正在做什么；
- 下一步该进入哪里；
- 当前页面最重要的动作是什么。

---

# 2. 当前整体判断

```text
HOME_DASHBOARD_DIRECTION = GOOD
NAVIGATION_COMPLEXITY = CURRENTLY_ACCEPTABLE
LIST_VIEWS = GENERALLY_GOOD
PUBLIC_PROFILE_INTERACTION_LANGUAGE = GOOD_REFERENCE
DOMAIN_INTELLIGENCE_DIRECTION = STRONG

OVERVIEW_VISUAL_SPACING = TOO_LOOSE
OVERVIEW_REPEATED_ACTIONS = TOO_VISIBLE
ROUNDING_LEVEL = TOO_HIGH
CARD_IN_CARD_USAGE = TOO_HIGH
PAGE_TITLE_WEIGHT = TOO_HEAVY

QUOTE_EDITOR_INFORMATION_ARCHITECTURE = NEEDS_REDESIGN
QUOTE_EDITOR_VISUAL_HIERARCHY = TOO_FLAT
RIGHT_SIDEBAR_RESPONSIBILITIES = TOO_MANY
PROGRESSIVE_DISCLOSURE = INSUFFICIENT
AI_INTEGRATION = TOO_SEPARATE

CLIENT_PORTAL_INFORMATION_ARCHITECTURE = UNRESOLVED
SETTINGS_IMPLEMENTATION = MISSING
ACCOUNT_MENU_INTERACTION = NEEDS_FIX
CLIENT_LIST_HIGH_DENSITY_BEHAVIOR = NEEDS_SIMULATION
```

---

# 3. Dashboard 设计原则

## 3.1 Dashboard 不是功能目录

默认首页首先回答：

1. 现在有什么需要我处理？
2. 我正在做哪些工作？
3. 接下来有什么重要事情？

而不是首先展示：

- 有多少 Quotes；
- 有多少 Invoices；
- 有多少 Clients；
- 各功能入口在哪里。

推荐优先级：

```text
Needs Attention
↓
Current Work / Active Documents
↓
Upcoming
↓
Recent Documents
↓
Lightweight Create Action
```

---

## 3.2 工作对象 > 页面名称

当前页面标题（如 Quotes / Invoices / Clients）视觉过重。

原则：

> 页面名称只负责告诉用户“我在哪里”，不应成为页面视觉主角。

视觉优先级应是：

```text
Current work / current document / current decision
>
Page title
>
Metadata
```

例如：

```text
Xinhe KV Campaign
Quote ready to send

¥78,000 · 5 deliverables

Updated 18 minutes ago
```

而不是让 `Quotes` / `Invoices` 标题接近品牌字级别。

---

# 4. Overview 优化

## 4.1 Needs Attention

当前问题：

- 每条信息横跨过宽；
- 左侧主体信息与右侧 `Open Quote / Open Invoice` 距离过远；
- 中间形成大面积无效空白；
- 同一动作重复出现，视觉噪音高；
- 大圆角容器套小圆角条目，层级显得“油”。

建议：

> 改为平整的 Section + List Rows。

示意：

```text
Needs Attention
────────────────────────────────────────
INV-1042   Acme Campaign
Overdue 6 days · ¥18,000                ›
────────────────────────────────────────
Q-2081     Xinhe KV Campaign
Viewed 3 days ago · No response         ›
```

原则：

- 整行可点击；
- `Open Quote / Open Invoice` 不再永久显示；
- hover / keyboard focus 时右侧可以出现 `Open →` 或 chevron；
- 触摸设备不依赖 hover 才能进入；
- 内容区域设置合理最大宽度，避免业务关联信息被横向拉散。

---

## 4.2 Recent Documents

与 Needs Attention 使用同一视觉语言：

```text
Q-2081   Xinhe KV Campaign     Approved   ¥78,000  ›
INV-1042 Acme Campaign          Overdue    ¥18,000  ›
```

建议：

- 不做每条单独大圆角卡片；
- 次要动作隐藏到 hover / `•••`；
- 保留状态；
- 行本身作为主要进入方式。

---

## 4.3 Scope Snapshot

当前创始人无法立即理解该模块的价值，这是强烈信号。

建议：

```text
SCOPE_SNAPSHOT_ON_OVERVIEW = REASSESS
```

如果它只是展示：

- 当前 Quote 的 Scope；
- Deliverables；
- Usage；
- Production 信息；

则更适合进入：

```text
Project / Quote context
```

而不是全局 Overview。

只有当它能变成明确 actionable 信息，例如：

```text
3 projects need scope clarification
```

才考虑保留在 Overview。

默认建议：

> **从 Overview 降级或移除。**

---

## 4.4 Quick Actions

当前不应让多个创建动作持续占据一级视觉空间。

建议：

```text
+ New
```

展开：

```text
New inquiry
New quote
New invoice
New client
```

原则：

> Dashboard 展示工作，而不是长期展示功能目录。

---

# 5. 列表页：Quotes / Invoices

当前方向总体可以保留。

优点：

- 没有强烈卡片割裂；
- 信息扫描效率尚可；
- 结构相对克制。

后续优化：

### 永久减少重复次要动作

以下不应长期全部显示：

- Copy Link
- Download
- Open
- More Actions

建议：

```text
Primary row click
+
status
+
hover reveal / •••
```

### 状态连接下一步动作

不要只显示：

```text
Approved
```

而可以进一步表达：

```text
Approved · Invoice not created
```

并提供：

```text
Create invoice
```

方向：

> **Status → Next Action**

---

# 6. 高数据量 UI 验证

所有列表页后续都必须进行高密度模拟。

禁止只使用：

```text
2 Quotes
1 Invoice
3 Clients
```

判断 UI。

至少模拟：

```text
50 Clients
100 Quotes
80 Invoices
Long client names
Long project names
Mixed currencies
Draft / Sent / Viewed / Approved / Overdue / Paid
Long dates
Large totals
```

目的：

> 验证真正业务规模下的信息密度、对齐、截断、扫描速度与操作效率。

---

# 7. Clients

当前客户少时看起来可接受，但暂时无法判断高数据量表现。

后续重点：

- Search
- Sort
- Active / Recent
- Last activity
- Current state
- Efficient scanning

避免未来把以下所有内容同时塞入 Client 首页：

- Revenue chart
- AI score
- Notes
- Activity feed
- Projects
- Messages
- Client value
- Large analytics cards

原则：

> Client 页面首先回答：  
> **这个客户是谁 + 现在和他发生什么。**

---

# 8. Public Profile：可复用的交互语言

创始人明确喜欢两个交互：

## 8.1 Hover Elevation

当鼠标进入一个可操作的大区块：

- 整块轻微浮起；
- 用户会自然感知这是一个可进入对象。

建议全站抽象为：

```text
INTERACTIVE_SURFACE
```

状态：

```text
Rest:
flat

Hover:
subtle background change
~1px lift
very light shadow
secondary action reveal
```

原则：

> 静止时平，交互时才浮。

---

## 8.2 Active Editing Indicator

Public Profile 编辑时的小蓝色指示效果可复用。

建议：

```text
ACTIVE_EDITING
```

表现：

- small accent bar
- subtle focus ring
- light tint

目标：

> 明确告诉用户“你现在正在操作这一块”。

不要让整页所有输入框同时具有相同视觉活跃度。

---

# 9. 全站视觉语言

建议暂定设计方向：

# Quiet Workspace

关键词：

```text
Flat by default
Moderate density
Few permanent shadows
Less rounding
List / Row first
Hover creates elevation
Editing creates focus
Secondary actions recede
Primary work stays visually dominant
```

---

# 10. 圆角策略

当前问题：

> 大圆角 Section  
> → 圆角 Card  
> → 圆角 Input  
> → 圆角 Button

层层嵌套导致视觉偏“油”。

硬规则：

> **不要用圆角表达所有层级。**

层级优先使用：

```text
Spacing
Typography
Divider
Background
Interaction
```

圆角只是辅助。

建议趋势：

```text
Row                     = no radius
Input / small control   = ~6–8px
Interactive card        = ~8px
Modal / special surface = ~10–12px
```

数字不是最终 Design Token，但整体需要明显收紧。

同时：

```text
MAX_SURFACE_NESTING ≈ 2
```

避免 Card → Card → Card。

---

# 11. 内容宽度与空白

当前 Overview 中：

> 左侧内容与右侧动作被显示器宽度拉开。

问题不是“空白太多”，而是：

> **业务关联信息内部被空白拆散。**

原则：

```text
Whitespace around content = good
Whitespace inside relationships = bad
```

建议：

- Dashboard 主工作区设置舒适 max-width；
- 大屏不强制把所有信息铺满屏幕；
- 同一业务对象的信息保持相对聚拢。

---

# 12. Sidebar / Side Navigation

当前导航：

```text
Overview
Quotes
Invoices
Clients
Public Profile
Client Portal
Settings
```

整体数量暂时可控，但需要统一视觉。

## 12.1 图标与文字

问题：

- 文字起点不统一；
- icon optical size 不一致；
- icon 与 label 间距不统一；
- 行高 / padding 需要规范。

建议：

```text
[ fixed icon column ] [ fixed label start ]
```

原则：

- 所有文字左边缘对齐；
- icon column 固定宽度；
- icon 视觉大小统一，而不仅仅 CSS bounding box 相同；
- 行高统一；
- active state 克制；
- icon/text gap 固定。

---

# 13. 推荐 Sidebar 层级

建议后续逐步收敛为：

```text
CORVIOZ

Overview
Quotes
Invoices
Clients

────────────

Public Profile


[底部]

Settings

[Avatar] Account
```

意义：

### 上部
高频业务工作。

### 中部
对外资产。

### 底部
系统 / 配置 / 账户。

不要让所有入口从上到下拥有相同视觉权重。

---

# 14. Client Portal

当前 Client Portal URL 指向逻辑需要修正。

必须明确：

```text
PUBLIC_PROFILE ≠ CLIENT_PORTAL
```

### Public Profile
公开给潜在客户访问。

### Client Portal
特定客户 / 特定项目的私有工作空间。

## 14.1 是否保留全局 Sidebar 入口

建议重新评估。

用户通常不会想：

> “我要进入 Client Portal。”

更常见是：

> “我要看看 Acme 客户能看到什么。”

因此 Client Portal 更适合：

```text
Client
→ Portal
```

或：

```text
Project
→ Client View
```

## 14.2 如果需要全局入口

则必须有明确管理意义：

```text
Client Portal

Active portals
────────────────────
Acme Campaign       View →
Nike Portrait       View →
ABC Event           View →

Portal Settings
Branding · Access · Defaults
```

而不是直接跳到某个公众 URL。

---

# 15. Settings

当前 Settings 为空，后续需要真正建立配置体系。

建议结构：

```text
Profile & Business
Branding
Documents & Defaults
Payments
Client Experience
Notifications
Integrations
Account & Security
Billing
```

## 15.1 Profile & Business

```text
Avatar
Display name
Business name
Email
Phone
Website
Address
Timezone
```

## 15.2 Branding

全局继承到：

- Quote
- Invoice
- Client Portal
- Public Profile

字段尽量克制：

```text
Logo
Brand accent
Document logo
Basic appearance
```

不要发展成：

- 大量字体选择；
- radius slider；
- padding editor；
- page builder。

## 15.3 Documents & Defaults

重要，因为它直接减少日常重复操作：

```text
Default currency
Quote number format
Invoice number format
Default tax
Default deposit
Default payment terms
Default quote validity
Default usage wording
Default revision terms
```

原则：

> 复杂设置一次，日常工作变简单。

## 15.4 Payments

用于：

> 摄影师如何收钱。

不是 Corvioz 自己的订阅。

例如：

```text
Payment provider
Bank details
Online payment
Payment instructions
```

## 15.5 Client Experience

```text
Client Portal defaults
Portal branding
Client-facing communication defaults
Public Profile preferences
```

## 15.6 Integrations

未来：

- Google Calendar
- Apple Calendar
- Email
- Storage
- Accounting
- Other integrations

## 15.7 Account & Security

```text
Email
Authentication
Password / login methods
Active sessions
Delete account
```

## 15.8 Billing

专门表示：

> Corvioz Subscription

```text
Current plan
Billing cycle
Billing invoices
Upgrade / downgrade
Cancel subscription
```

硬规则：

```text
BUSINESS_PAYMENTS ≠ CORVIOZ_BILLING
```

---

# 16. Account 菜单

当前问题：

```text
Click Account → Open
Click outside → cannot close
Only click Account again → close
```

这是明确 UX defect。

修正行为：

```text
Click Account     → Open
Click outside     → Close
Press Escape      → Close
Click Account     → Toggle
Navigate away     → Close
```

同时支持 keyboard focus。

## 16.1 Account 内容

保持小，不做第二套 Settings。

推荐：

```text
[Avatar] Ray Kane
ray@...

Account settings
Billing & plan
──────────────
Sign out
```

未来只有在真正支持：

```text
Multi Workspace / Multiple Business
```

后再增加：

```text
Switch workspace
```

## 16.2 Account 与 Settings 的关系

### Account
快捷入口。

### Settings
真正配置页面。

例如：

```text
Account settings
→ /settings/account

Billing & plan
→ /settings/billing
```

---

# 17. Quote Workspace：目前最大 UX 重构点

当前 Quote Editor 同时显示：

- Workflow
- Client
- Quote Number
- Currency
- Client Specifications
- Document Summary
- Scope
- Deliverables
- Usage
- Delivery & Boundaries
- Review with Corvioz
- Needs Attention
- Save
- Client-ready PDF

问题：

> 内容大多处于同一视觉层级。

结果：

> 用户第一次进入时不知道从哪里开始。

---

# 18. Quote 不应该是“超长完整表单”

目标：

> **Business Workspace**

而不是：

> Form dump。

推荐业务层级：

```text
Scope
Production
Usage
Pricing
Terms
```

可考虑 Section Workspace：

```text
Scope ✓   Production ✓   Usage !   Pricing   Terms
```

用户一次主要处理一个业务问题。

---

# 19. Progressive Disclosure

Quote 应分三层：

## Level 1 — 当前业务决策

```text
Scope
Production
Usage
Pricing
Terms
```

## Level 2 — 当前摘要

例如：

```text
6 final images
1 shoot day
China / 12 months
¥78,000
```

## Level 3 — 具体字段

用户进入具体 Section 后才显示：

- Shoot type
- Location
- Deliverables
- Aspect ratio
- usage media
- overtime
- etc.

原则：

> 不删除复杂度，隐藏不需要立即处理的复杂度。

---

# 20. Photography Workflow 选择

当前如果同时展示大量 workflow cards，会让用户先学习模板库。

后续更推荐：

```text
What are you quoting?

Commercial / Product
Event Coverage
Food Photography
Other

View all workflows
```

未来 AI Brief 成熟后可进一步：

```text
Paste client brief
↓
Corvioz suggests:
Commercial / Product Photography
Use this workflow
```

目标：

> 用户告诉系统“我现在在做什么”，而不是先学习 Corvioz 的模板体系。

---

# 21. Quote 右侧栏

当前同时承担：

1. Document Summary
2. Review with Corvioz
3. Needs Attention
4. Save Quote
5. Client-ready PDF

职责过多。

建议右侧 Sticky Panel 只承担：

> 当前 Quote 状态。

例如：

```text
Quote

¥78,000

3 sections complete
2 things need attention

Review & Send
```

---

# 22. AI / Intelligence 视觉原则

不要在 Quote 页面长期保留一个大型：

```text
Review with Corvioz
```

独立卡片。

AI 应该：

> 在问题发生的位置出现。

例如：

```text
Usage                              !

China · 12 months

Media usage is not specified.
Review
```

或者：

```text
Production                         !

Talent is included,
but wardrobe responsibility is unclear.
Resolve
```

原则：

```text
AI = local intervention
NOT = separate visual universe
```

严重问题才提升到页面级 `Needs Attention`。

---

# 23. A4 / Client-ready Document

Corvioz 当前没有 HoneyBook 式 A4 Editor。

建议：

> **不要直接复制 HoneyBook 的 Document Builder。**

核心产品哲学：

> **Quote should be generated from business data, not designed like a document.**

结构：

```text
BUSINESS DATA
────────────────

Quote Workspace
Scope
Production
Usage
Pricing
Terms

        ↓

CLIENT OUTPUT
────────────────

Preview
PDF
Client Portal
Send
```

---

# 24. Preview & Send 层级

A4 / client document 应位于：

```text
Quote Workspace
↓
Review
↓
Preview & Send
```

而不是直接作为 Quote 主编辑器。

---

# 25. Focus Mode

进入 Preview / Client-facing document 时：

- 主导航降权；
- 背景暗下去 / 降低对比；
- 周围 chrome 后退；
- 中间客户文档保持明亮；
- 视觉重心落到 document。

目标：

> 像 Photoshop / Lightroom 的工作台一样，画布成为主角。

此模式适合：

- Preview
- Document review
- Client-facing output check

不建议用于普通 Scope / Production / Usage 工作区。

---

# 26. A4 编辑权限应克制

不建议在 A4 上直接编辑：

- photographer fee
- usage logic
- production cost
- deposit logic
- scope logic

这些应该回 Business Workspace 修改。

A4 / Preview 只允许有限 presentation editing，例如：

```text
Show / hide section
Client-facing group label
Optional note
Basic logo placement
```

避免 Corvioz 变成 Canva / page builder。

---

# 27. Studio Ninja 对比结论

## 可取之处

```text
Single-purpose pages
Simple list/table views
Settings hidden from daily work
Low visual noise
Next Task in work lists
Whitespace
```

## 不建议照搬

```text
Analytics-heavy dashboard
Entity-first navigation everywhere
Large module list
User must understand Lead / Job / Payment model first
Persistent AI / promo / support floating elements
```

---

# 28. Corvioz 应比 Studio Ninja 再进一步

Studio Ninja 更接近：

```text
Dashboard
↓
Choose module
↓
Work
```

Corvioz 目标：

```text
Dashboard
↓
What needs attention
↓
Open exact work
↓
Complete next action
```

方向：

```text
ENTITY-FIRST → ACTION / WORK-FIRST
```

---

# 29. Attention Budget

建议把它正式变成产品规则。

每个页面只有极少元素获得一级视觉权重。

## Level 1
当前任务 / 阻塞问题 / Primary Action

## Level 2
状态 / 金额 / 时间 / Scope Summary

## Level 3
普通业务信息

## Level 4
Metadata / History / Settings / Advanced

新增功能时不应先问：

> “放哪张卡？”

而应先问：

> **它值得占第几级注意力？**

Level 4 内容默认不应出现在 Dashboard 第一屏。

---

# 30. 高层信息架构

建议长期目标：

```text
Dashboard
    ↓
Focus / Needs Attention

Project / Client / Quote
    ↓
Organize current work

Workspace
    ↓
Complete business decisions

Details
    ↓
Advanced complexity

Preview
    ↓
Client output

Settings
    ↓
Low-frequency configuration

Intelligence
    ↓
Appears contextually
```

---

# 31. 下一阶段 UI 工作优先级

建议不推翻现有 Dashboard。

## P1 — Overview 清理

- Needs Attention row 化
- Recent Documents row 化
- remove repeated Open buttons
- max-width
- reduce rounding
- reassess Scope Snapshot
- reduce Quick Actions

## P2 — Global Visual Discipline

- reduce page title weight
- sidebar alignment
- icon optical normalization
- rounding tokens
- hover elevation
- active edit indicator
- secondary action behavior

## P3 — Account / Settings / Client Portal

- fix click-outside Account
- build Settings IA
- Account shortcuts
- correct Client Portal semantics and route

## P4 — Quote Workspace IA

重点最大：

- progressive disclosure
- business sections
- AI local findings
- sidebar simplification
- visual hierarchy

## P5 — Preview / Send

- Focus Mode
- A4 / client-facing output
- limited presentation controls

## P6 — High-density Validation

- 50+ clients
- 100+ quotes
- 80+ invoices
- long names
- mixed statuses
- responsive states

---

# 32. 非目标

当前不建议：

```text
FULL_DASHBOARD_REWRITE = NO
APPLE_VISUAL_CLONE = NO
HONEYBOOK_DOCUMENT_BUILDER_CLONE = NO
EVERYTHING_AS_CARD = NO
EVERYTHING_AS_HOVER_ONLY = NO
AI_FLOATING_WIDGET_EVERYWHERE = NO
SETTINGS_IN_MAIN_WORKFLOW = NO
```

---

# 33. Design Acceptance Tests

未来每次 UI 改动建议至少做：

## New User Test

不给教程。

只告诉摄影师：

> “你刚收到一个客户询盘，需要做报价。”

判断：

```text
Can user find the starting point within ~10 seconds?
```

再告诉他：

> “客户已经接受报价。”

判断：

```text
Can user understand the next action within ~10 seconds?
```

## Visual Hierarchy Test

关闭：

- tooltip
- onboarding
- AI chat

判断：

> 用户是否仍然知道当前工作、状态和主要动作？

如果不能：

> UI 本身仍然依赖解释。

## Density Test

验证：

- 5 条数据
- 50 条数据
- 100 条数据

都能保持：

- scanability
- hierarchy
- alignment
- action clarity

---

# 34. 当前最终设计语言

> **Quiet Workspace**

以及：

> **Complexity stays with Corvioz. Focus stays with the photographer.**

视觉表现：

```text
Less rounding
Less permanent shadow
Less card nesting
More rows / lists
More hierarchy
More contextual interaction
More focus
Fewer persistent actions
```

---

# 35. 主线吸收建议

```text
DOCUMENT_ROLE = DASHBOARD_UI_UX_DESIGN_INPUT
IMPLEMENTATION_AUTHORITY = NO
CURRENT_MAINLINE_IMPACT = NONE

RECOMMENDATION =
ABSORB INTO FUTURE DASHBOARD / QUOTE WORKSPACE DESIGN GATE

DO_NOT_INTERRUPT_CURRENT_MAINLINE = YES

HIGHEST_PRIORITY =
QUOTE_WORKSPACE_INFORMATION_ARCHITECTURE

SECONDARY_PRIORITY =
OVERVIEW_VISUAL_HIERARCHY
SIDEBAR / SETTINGS / ACCOUNT CLEANUP

CLIENT_PORTAL =
REQUIRES_SEMANTIC_ROUTING_FIX

A4_PREVIEW =
FUTURE_CLIENT_OUTPUT_LAYER
NOT_PRIMARY_BUSINESS_EDITOR
```

---

## Document Status

```text
CORVIOZ_DASHBOARD_UI_UX_DESIGN_SPEC_V0_1 = COMPLETE
FOUNDER_FEEDBACK = INCLUDED
CURRENT_DASHBOARD_REVIEW = INCLUDED
STUDIO_NINJA_COMPARISON = INCLUDED
NAVIGATION_RECOMMENDATION = INCLUDED
SETTINGS_IA = INCLUDED
ACCOUNT_INTERACTION = INCLUDED
CLIENT_PORTAL_REVIEW = INCLUDED
QUOTE_WORKSPACE_DIRECTION = INCLUDED
PREVIEW_LAYER_DIRECTION = INCLUDED
READY_FOR_MAINLINE_REVIEW = YES
```
