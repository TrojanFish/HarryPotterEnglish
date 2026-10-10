# 霍格沃茨魔法英语 · 即时查词与全局生词本系统设计规格

- **日期**：2026-10-10
- **状态**：已评审通过 (Approved)
- **文档路径**：`docs/superpowers/specs/2026-10-10-dictionary-lookup-and-vocab-design.md`

---

## 1. 目标与背景 (Goals & Background)

在原版有声学习（Harry Potter 听读）中，学生在精听字幕时经常遇到生词。原系统仅有占位性质的简单 toast 记录，没有真正的查词展示（缺乏音标、发音、详细释义与考纲标识），且顶部导航栏缺少生词本常驻入口，导致学生无法随时查看或复习沉淀的词汇。

本设计旨在构建完整闭环的**即时查词系统**与**全局生词本管理体系**：
1. **即时查词 (`WordLookupModal`)**：在精听字幕中点击任意英文单词，音频自动暂停，以 iOS Bottom Sheet（移动端）或居中卡片（桌面端）即时展示单词音标、真人/TTS发音、精准释义、考纲标签、原著语境例句及一键收录切换。
2. **全局生词本入口与抽屉升级 (`VocabularyDrawer` & `App.vue`)**：顶栏常驻图标按钮带实时词数 Badge 徽标；抽屉支持移动端向下滑动关闭手势、单词卡片发音喇叭、关键词搜索过滤与艾宾浩斯 5-Box 分盒复习。

---

## 2. 交互与用户旅程 (User Journeys)

### 旅程 A：精听字幕即时查词
1. 学生在【步骤 1 精听】中收听音频，点击字幕中生词（如 `peculiar`、`cloak`、`quill`）。
2. 播放器自动暂停原版音频，防止学生在查词时听力跟丢。
3. 屏幕底部平滑升起 iOS Bottom Sheet 查词卡片（桌面端为居中卡片）：
   - 显示大号衬线体单词、国际音标 `/pɪˈkjuːliə(r)/`、考纲标签（如 `高考拓展`）。
   - 提供 44×44px 播放喇叭，调用 Web Speech API 朗读标准英音发音。
   - 显示中文核心释义及词性（`adj. 奇怪的，古怪的；特殊的`）。
   - 显示当前所在章节的上下文原句引用。
   - 底部全宽按钮：若未收录，展示【收录至生词本】；点击后立即变为【已收录 (点击移除)】，支持自由反悔。
4. 学生点击关闭或向下滑动拖拽把手关闭弹窗，音频可根据意愿恢复播放。

### 旅程 B：随时管理生词本
1. 学习者在任何步骤点击顶部导航栏右侧的【生词本】图标按钮（带动态数字徽标，如 `12`）。
2. 移动端自底向上滑出、桌面端自右侧滑出生词本抽屉。
3. 提供搜索框，输入词根即时筛选出匹配生词。
4. 每个生词卡片均可点击喇叭播放发音，进行听音认词。
5. 支持艾宾浩斯 Leitner 5-Box 盒子筛选、熟记升级（Box +1）、导出 Anki (TSV)、打印 A4 羊皮纸词卡 (PDF)。

---

## 3. 模块拆解与技术架构 (Architecture & Modules)

### 3.1 离线词典数据集与查询服务 (`src/data/dictionaryData.js`)
* **核心字典表 `DICTIONARY`**：预收录哈利波特前序章节高频生词及初高中核心词汇，包括：
  * `word`：标准小写原形单词
  * `phonetic`：国际音标 (IPA)，如 `/kləʊk/`
  * `pos`：词性，如 `n.`、`adj.`、`v.`
  * `definition`：通俗易懂的中文释义
  * `tag`：考纲徽章，可选 `原著高频`、`中考核心`、`高考拓展`
* **词形清洗与智能词形还原 `lookupWord(rawWord)`**：
  * 正则清洗两端标点符号（如 `“privet”` -> `privet`）。
  * 词尾屈折还原算法：若原形未命中，自动尝试脱除复数 `-s/-es`、过去式 `-ed`、进行时 `-ing`、副词 `-ly`。
  * 离线兜底生成：未命中的生僻词，返回安全规范的对象结构，保证 `phonetic`、`definition: '点击收录至生词本'` 完整，发音仍可由 TTS 原生支持，绝对不抛未捕获异常。

### 3.2 生词本 Store 增强 (`src/stores/vocabStore.js`)
* **存储模型升级**：
  ```javascript
  {
    id: 1718293021,
    word: 'cloak',
    phonetic: '/kləʊk/',
    pos: 'n.',
    definition: '斗篷，披风；遮盖物',
    tag: '原著高频',
    contextQuote: 'He was wearing an emerald-green cloak.',
    box: 1,
    addedAt: 1718293021000
  }
  ```
* **Store 动作扩展**：
  * `hasWord(word)`：检查当前列表中是否已收录该词（大小写不敏感）。
  * `addWord(wordData, contextQuote)`：支持传入富字段词条对象，若已存在则返回 `false`。
  * `removeWord(word)`：根据单词文本直接从生词本中移除。
  * `toggleWord(wordData, contextQuote)`：若已存在则移除并返回 `false`，若不存在则收录并返回 `true`。

### 3.3 即时查词卡片组件 (`src/components/common/WordLookupModal.vue`)
* **Props & Emits**：
  * `props: { isOpen: Boolean, word: String, contextQuote: String }`
  * `emits: ['close']`
* **人因与样式规范**：
  * 移动端采用与 `StorageManagerModal`、`AudioPlayer` 定时器一致的 `useBottomSheet` 物理触摸向下滑动关闭手势。
  * 顶部居中 `w-10 h-1.5 rounded-full bg-[#d4d4d8]` 药丸把手。
  * 严格遵循 `educational-ui-spec`：零 Emoji、零浮夸阴影、所有按钮 $\ge 44 \times 44\text{px}$ 触控热区。
* **语音发音实现**：
  * 封装 `playPronunciation(word)` 函数，调用 `window.speechSynthesis`。
  * 语言设置为 `en-GB` / `en-US`，语速为 `0.9`（适中清晰），正在播放时赋予喇叭微动效。

### 3.4 顶栏入口与生词本抽屉升级 (`src/App.vue` & `src/components/VocabularyDrawer.vue`)
* **`App.vue` 顶栏工具区**：
  * 在 `isAnalyticsOpen` 按钮左侧新增：
    ```vue
    <button
      type="button"
      @click="isVocabOpen = true"
      class="relative min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer"
      title="生词本"
      aria-label="打开生词本"
    >
      <BookMarked class="w-5 h-5" />
      <span
        v-if="vocabStore.vocabList.length > 0"
        class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2563eb] text-white text-[10px] font-mono font-medium flex items-center justify-center pointer-events-none"
      >
        {{ vocabStore.vocabList.length }}
      </span>
    </button>
    ```
* **`VocabularyDrawer.vue` 升级**：
  * 移动端添加触摸向下滑动关闭手势。
  * 在每个卡片词头增加发音喇叭按钮（`<Volume2>`）。
  * 增加搜索输入框：
    `<input v-model="searchQuery" class="text-base sm:text-sm ..." placeholder="搜索生词..." />`（防 Safari 自动缩放）。

### 3.5 精听字幕联动 (`src/components/session/StepListening.vue`)
* `handleWordClick(token, fullSentence)` 改为：
  1. 记录当前音频播放状态 `const wasPlaying = player.isPlaying`。
  2. 若正在播放，调用 `player.pause()` 暂停。
  3. 打开 `WordLookupModal`，传入当前单词与句子。
  4. 弹窗关闭时，通知完成。

---

## 4. 边界情况与安全策略 (Edge Cases & Safety)

1. **标点与大小写边界**：
   - 包含撇号（`Dursley's`, `couldn't`）需正确处理；首字母大写（`Privet`）在词典中大小写不敏感匹配。
2. **Web Speech API 缺失环境**：
   - 在部分移动端 WebView 或特殊浏览器中检测 `typeof window !== 'undefined' && 'speechSynthesis' in window`，优雅降级，防止报错。
3. **数据持久化容量控制**：
   - 生词本存储于 `localStorage['hp_vocab_list']`，单个条目体积约 150 字节，即使收录 2000 个生词仅占用约 300KB，远低于 5MB 配额。
4. **零阴影与零 Emoji 校验**：
   - 严格不使用 `shadow-lg/xl/2xl`，100% 使用 Lucide 矢量图标，通过 `npm run check-emojis` 自动化门禁。

---

## 5. 测试与验证计划 (Testing & Verification Plan)

1. **词典与 Store 单元测试** (`tests/vue3/vocabAndDictionary.test.js`)：
   - 测试 `lookupWord` 对精准匹配、复数时态还原、未命中兜底的解析正确性。
   - 测试 `vocabStore.toggleWord`、`hasWord`、`addWord` 字段持久化与去重。
2. **UI 组件交互测试** (`tests/vue3/wordLookupModal.test.js`)：
   - 测试查词弹窗显示音标、释义、例句与收录切换按钮。
   - 测试点击发音按钮触发 TTS。
3. **集成门禁验证**：
   - `npm test`（确保已有 36+ 现有测试全部通过且新增测试通过）
   - `npm run check-emojis`（0 个违规字符）
   - `npm run verify-security`（0 密钥泄露）
   - `npm run build`（Vite 生产构建通过）
