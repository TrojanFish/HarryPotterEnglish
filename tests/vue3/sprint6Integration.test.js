import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('Sprint 6 Final Integration & Cross-Device Shell Suite', () => {
  const bookshelfPath = path.resolve('src/components/BookshelfDrawer.vue')
  const assessmentPath = path.resolve('src/components/assessment/AssessmentHub.vue')
  const desktopSidebarPath = path.resolve('src/components/navigation/DesktopSidebarVue.vue')
  const tabletRailPath = path.resolve('src/components/navigation/TabletRailVue.vue')
  const mobileTopBarPath = path.resolve('src/components/navigation/MobileTopBarVue.vue')
  const appShellPath = path.resolve('src/components/layout/AppShell.vue')
  const cloudSyncModalPath = path.resolve('src/components/sync/CloudSyncModal.vue')

  const touchedFiles = [
    bookshelfPath,
    assessmentPath,
    desktopSidebarPath,
    tabletRailPath,
    mobileTopBarPath,
    appShellPath,
    cloudSyncModalPath
  ]

  test('1. BookshelfDrawer.vue mounts RecommendationCard and handles open-chapter and open-ted', () => {
    assert.ok(fs.existsSync(bookshelfPath), 'BookshelfDrawer.vue must exist')
    const content = fs.readFileSync(bookshelfPath, 'utf-8')
    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'BookshelfDrawer.vue SFC parsing must succeed')

    // Import RecommendationCard
    assert.ok(
      content.includes("import RecommendationCard from './home/RecommendationCard.vue'") ||
      content.includes('import RecommendationCard from "./home/RecommendationCard.vue"'),
      'BookshelfDrawer must import RecommendationCard from ./home/RecommendationCard.vue'
    )

    // Mount RecommendationCard in template
    assert.ok(
      content.includes('<RecommendationCard'),
      'BookshelfDrawer must mount <RecommendationCard'
    )
    assert.ok(
      content.includes('@open-chapter="onRecommendationChapter"'),
      'BookshelfDrawer must bind @open-chapter="onRecommendationChapter"'
    )
    assert.ok(
      content.includes('@open-ted="onRecommendationTed"'),
      'BookshelfDrawer must bind @open-ted="onRecommendationTed"'
    )

    // Handler logic
    assert.ok(
      content.includes('function onRecommendationChapter') || content.includes('const onRecommendationChapter'),
      'Must define onRecommendationChapter'
    )
    assert.ok(
      content.includes('function onRecommendationTed') || content.includes('const onRecommendationTed'),
      'Must define onRecommendationTed'
    )
    assert.ok(content.includes('useTedStore'), 'Must import or use useTedStore')
    assert.ok(content.includes('useNavigationStore'), 'Must import or use useNavigationStore')
    assert.ok(
      content.includes('selectTalk('),
      'onRecommendationTed must call selectTalk on tedStore'
    )
  })

  test('2. AssessmentHub.vue mounts RecommendationCard and handles open-chapter and open-ted', () => {
    assert.ok(fs.existsSync(assessmentPath), 'AssessmentHub.vue must exist')
    const content = fs.readFileSync(assessmentPath, 'utf-8')
    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'AssessmentHub.vue SFC parsing must succeed')

    // Import RecommendationCard
    assert.ok(
      content.includes("import RecommendationCard from '../home/RecommendationCard.vue'") ||
      content.includes('import RecommendationCard from "../home/RecommendationCard.vue"'),
      'AssessmentHub must import RecommendationCard from ../home/RecommendationCard.vue'
    )

    // Mount in template
    assert.ok(
      content.includes('<RecommendationCard'),
      'AssessmentHub must mount <RecommendationCard'
    )
    assert.ok(
      content.includes('@open-chapter="handleOpenChapter"') || content.includes('@open-chapter="onRecommendationChapter"'),
      'AssessmentHub must listen to @open-chapter'
    )
    assert.ok(
      content.includes('@open-ted="handleOpenTed"') || content.includes('@open-ted="onRecommendationTed"'),
      'AssessmentHub must listen to @open-ted'
    )

    // Handlers
    assert.ok(
      content.includes('usePlayerStore') || content.includes('useCatalogStore'),
      'Must import usePlayerStore or useCatalogStore for chapter playback'
    )
    assert.ok(content.includes('useTedStore'), 'Must import useTedStore')
    assert.ok(content.includes('useNavigationStore'), 'Must import useNavigationStore')
    assert.ok(content.includes('selectTalk('), 'Must invoke tedStore.selectTalk')
  })

  test('3. DesktopSidebarVue, TabletRailVue, and MobileTopBarVue emit open-cloud-sync with Cloud icon', () => {
    // DesktopSidebarVue
    assert.ok(fs.existsSync(desktopSidebarPath), 'DesktopSidebarVue.vue must exist')
    const desktopContent = fs.readFileSync(desktopSidebarPath, 'utf-8')
    assert.ok(desktopContent.includes("'open-cloud-sync'"), "DesktopSidebarVue must emit 'open-cloud-sync'")
    assert.ok(desktopContent.includes('Cloud'), "DesktopSidebarVue must import and use Cloud icon")
    assert.ok(desktopContent.includes('云端漫游'), "DesktopSidebarVue must contain '云端漫游' action")

    // TabletRailVue
    assert.ok(fs.existsSync(tabletRailPath), 'TabletRailVue.vue must exist')
    const tabletContent = fs.readFileSync(tabletRailPath, 'utf-8')
    assert.ok(tabletContent.includes("'open-cloud-sync'"), "TabletRailVue must emit 'open-cloud-sync'")
    assert.ok(tabletContent.includes('Cloud'), "TabletRailVue must import and use Cloud icon")

    // MobileTopBarVue
    assert.ok(fs.existsSync(mobileTopBarPath), 'MobileTopBarVue.vue must exist')
    const mobileContent = fs.readFileSync(mobileTopBarPath, 'utf-8')
    assert.ok(mobileContent.includes("'open-cloud-sync'"), "MobileTopBarVue must emit 'open-cloud-sync'")
    assert.ok(mobileContent.includes('Cloud'), "MobileTopBarVue must import and use Cloud icon")
  })

  test('4. AppShell.vue mounts CloudSyncModal and wires isCloudSyncOpen reactive state', () => {
    assert.ok(fs.existsSync(appShellPath), 'AppShell.vue must exist')
    const content = fs.readFileSync(appShellPath, 'utf-8')

    // Import CloudSyncModal
    assert.ok(
      content.includes("import CloudSyncModal from '../sync/CloudSyncModal.vue'") ||
      content.includes('import CloudSyncModal from "../sync/CloudSyncModal.vue"'),
      'AppShell must import CloudSyncModal'
    )

    // Mount CloudSyncModal
    assert.ok(content.includes('<CloudSyncModal'), 'AppShell must mount <CloudSyncModal')
    assert.ok(content.includes('isCloudSyncOpen'), 'AppShell must bind isCloudSyncOpen reactive ref')
    assert.ok(content.includes('@close='), 'AppShell must bind @close on CloudSyncModal')

    // Listen to open-cloud-sync on 3 shells
    assert.ok(
      content.includes('@open-cloud-sync="openCloudSync"') ||
      content.includes('@open-cloud-sync="isCloudSyncOpen = true"'),
      'AppShell must listen to @open-cloud-sync from navigation shells'
    )
  })

  test('5. CloudSyncModal.vue guards Escape key with isOpen, confirms regeneration, and prevents self-pairing', () => {
    assert.ok(fs.existsSync(cloudSyncModalPath), 'CloudSyncModal.vue must exist')
    const content = fs.readFileSync(cloudSyncModalPath, 'utf-8')

    // Guard handleKeydown
    assert.ok(
      content.includes('if (!props.isOpen) return') || content.includes('if (!props.isOpen)'),
      'CloudSyncModal handleKeydown must guard with if (!props.isOpen) return'
    )

    // Confirm regeneratePasscode
    assert.ok(
      content.includes('confirm('),
      'CloudSyncModal regeneratePasscode must require window.confirm before regenerating'
    )

    // Prevent self-pairing
    assert.ok(
      content.includes('currentPasscode.value') || content.includes('currentPasscode'),
      'CloudSyncModal must check input passcode against current device passcode to prevent self-pairing'
    )
  })

  test('6. Zero Unicode emojis across all touched files', () => {
    for (const f of touchedFiles) {
      assert.ok(fs.existsSync(f), `${f} must exist`)
      const content = fs.readFileSync(f, 'utf-8')
      const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
      assert.strictEqual(
        emojiMatches,
        null,
        `${path.basename(f)} must contain zero Unicode emojis, found: ${emojiMatches?.join(', ')}`
      )
      const rangeRegex = /[\u{1F300}-\u{1FAFF}]/u
      assert.strictEqual(
        rangeRegex.test(content),
        false,
        `${path.basename(f)} must contain zero emojis in range`
      )
    }
  })

  test('7. Apple HIG 44px touch targets on all new navigation buttons', () => {
    // Check DesktopSidebarVue
    const desktopContent = fs.readFileSync(desktopSidebarPath, 'utf-8')
    assert.ok(desktopContent.includes('min-h-[44px]'), 'DesktopSidebar buttons must enforce min-h-[44px]')
    assert.ok(desktopContent.includes('touch-manipulation'), 'DesktopSidebar buttons must enforce touch-manipulation')

    // Check TabletRailVue
    const tabletContent = fs.readFileSync(tabletRailPath, 'utf-8')
    assert.ok(tabletContent.includes('min-h-[44px]'), 'TabletRail buttons must enforce min-h-[44px]')
    assert.ok(tabletContent.includes('touch-manipulation'), 'TabletRail buttons must enforce touch-manipulation')

    // Check MobileTopBarVue
    const mobileContent = fs.readFileSync(mobileTopBarPath, 'utf-8')
    assert.ok(mobileContent.includes('min-h-[44px]'), 'MobileTopBar buttons must enforce min-h-[44px]')
    assert.ok(mobileContent.includes('touch-manipulation'), 'MobileTopBar buttons must enforce touch-manipulation')
  })
})
