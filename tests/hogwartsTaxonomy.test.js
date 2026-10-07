import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOUSES,
  OWLS_GRADES,
  HOGWARTS_TAXONOMY,
  getHouse,
  getOwlsGrade
} from '../src/constants/hogwartsTheme.js';

test('Hogwarts Taxonomy and Constants Registry Test Suite', async (t) => {
  await t.test('1.1: Four Houses definitions adhere to canon lore and color tokens', () => {
    assert.ok(HOUSES.gryffindor, 'Gryffindor house must be defined');
    assert.ok(HOUSES.slytherin, 'Slytherin house must be defined');
    assert.ok(HOUSES.ravenclaw, 'Ravenclaw house must be defined');
    assert.ok(HOUSES.hufflepuff, 'Hufflepuff house must be defined');

    // Gryffindor
    assert.strictEqual(HOUSES.gryffindor.nameZh, '格兰芬多');
    assert.strictEqual(HOUSES.gryffindor.animal, '狮子');
    assert.ok(HOUSES.gryffindor.primaryColor.includes('#b91c1c') || HOUSES.gryffindor.primaryColor.includes('red'));

    // Slytherin
    assert.strictEqual(HOUSES.slytherin.nameZh, '斯莱特林');
    assert.strictEqual(HOUSES.slytherin.animal, '蛇');
    assert.ok(HOUSES.slytherin.primaryColor.includes('#047857') || HOUSES.slytherin.primaryColor.includes('green'));

    // Ravenclaw
    assert.strictEqual(HOUSES.ravenclaw.nameZh, '拉文克劳');
    assert.strictEqual(HOUSES.ravenclaw.animal, '鹰');

    // Hufflepuff
    assert.strictEqual(HOUSES.hufflepuff.nameZh, '赫奇帕奇');
    assert.strictEqual(HOUSES.hufflepuff.animal, '獾');

    // getHouse helper
    assert.strictEqual(getHouse('gryffindor').nameZh, '格兰芬多');
    assert.strictEqual(getHouse('unknown_house').id, 'gryffindor', 'Default house should fallback to Gryffindor');
  });

  await t.test('1.2: O.W.L.s grading scale accurately maps Leitner SRS levels 0-5', () => {
    assert.strictEqual(OWLS_GRADES.length, 6, 'Must have 6 O.W.L.s grade definitions');

    // 0: Troll, 1: Dreadful, 2: Poor, 3: Acceptable, 4: Exceeds Expectations, 5: Outstanding
    const grades = OWLS_GRADES.map(g => g.grade);
    assert.deepStrictEqual(grades, ['T', 'D', 'P', 'A', 'E', 'O']);

    assert.strictEqual(getOwlsGrade(0).grade, 'T');
    assert.strictEqual(getOwlsGrade(0).nameZh, '巨怪级 (Troll)');

    assert.strictEqual(getOwlsGrade(1).grade, 'D');
    assert.strictEqual(getOwlsGrade(1).nameZh, '糟糕级 (Dreadful)');

    assert.strictEqual(getOwlsGrade(2).grade, 'P');
    assert.strictEqual(getOwlsGrade(2).nameZh, '勉强级 (Poor)');

    assert.strictEqual(getOwlsGrade(3).grade, 'A');
    assert.strictEqual(getOwlsGrade(3).nameZh, '及格级 (Acceptable)');

    assert.strictEqual(getOwlsGrade(4).grade, 'E');
    assert.strictEqual(getOwlsGrade(4).nameZh, '良好级 (Exceeds Expectations)');

    assert.strictEqual(getOwlsGrade(5).grade, 'O');
    assert.strictEqual(getOwlsGrade(5).nameZh, '杰出级 (Outstanding)');
    assert.ok(getOwlsGrade(5).isMastered, 'Grade O must indicate mastery');
  });

  await t.test('1.3: Taxonomy dictionary covers core navigation, audio tools, and gamification', () => {
    assert.strictEqual(HOGWARTS_TAXONOMY.navigation.bookshelf, '霍格沃茨图书馆');
    assert.strictEqual(HOGWARTS_TAXONOMY.navigation.player, '魔咒精研室');
    assert.strictEqual(HOGWARTS_TAXONOMY.navigation.vocab, '魔法宝典');
    assert.strictEqual(HOGWARTS_TAXONOMY.navigation.analytics, '巫师学籍档案');

    assert.strictEqual(HOGWARTS_TAXONOMY.audio.sleepTimer, '安眠魔药 (Draught of Peace)');
    assert.strictEqual(HOGWARTS_TAXONOMY.audio.pensieve, '冥想盆记忆库 (The Pensieve)');
    assert.strictEqual(HOGWARTS_TAXONOMY.audio.manaPoints, '沉浸法力点');
  });
});
