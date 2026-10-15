// Harry Potter Books and Chapters Structure
export const HP_BOOKS = [
  {
    id: 'book1',
    title: "Harry Potter and the Philosopher's Stone",
    cnTitle: "哈利·波特与魔法石",
    code: "HP1",
    cover: "",
    color: "#740001",
    chapters: [
      { id: 'b1_c01', number: 1, title: 'The Boy Who Lived', cnTitle: '大难不死的男孩', r2Key: 'book1/ch01' },
      { id: 'b1_c02', number: 2, title: 'The Vanishing Glass', cnTitle: '消失的玻璃', r2Key: 'book1/ch02' },
      { id: 'b1_c03', number: 3, title: 'The Letters from No One', cnTitle: '来自无名客的信', r2Key: 'book1/ch03' },
      { id: 'b1_c04', number: 4, title: 'The Keeper of the Keys', cnTitle: '钥匙保管员', r2Key: 'book1/ch04' },
      { id: 'b1_c05', number: 5, title: 'Diagon Alley', cnTitle: '对角巷', r2Key: 'book1/ch05' },
      { id: 'b1_c06', number: 6, title: 'The Journey from Platform Nine and Three-quarters', cnTitle: '从九又四分之三站台启程', r2Key: 'book1/ch06' },
      { id: 'b1_c07', number: 7, title: 'The Sorting Hat', cnTitle: '分院帽', r2Key: 'book1/ch07' },
      { id: 'b1_c08', number: 8, title: 'The Potions Master', cnTitle: '魔药课教授', r2Key: 'book1/ch08' },
      { id: 'b1_c09', number: 9, title: 'The Midnight Duel', cnTitle: '午夜决斗', r2Key: 'book1/ch09' },
      { id: 'b1_c10', number: 10, title: "Hallowe'en", cnTitle: '万圣节前夕', r2Key: 'book1/ch10' },
      { id: 'b1_c11', number: 11, title: 'Quidditch', cnTitle: '魁地奇比赛', r2Key: 'book1/ch11' },
      { id: 'b1_c12', number: 12, title: 'The Mirror of Erised', cnTitle: '厄里斯魔镜', r2Key: 'book1/ch12' },
      { id: 'b1_c13', number: 13, title: 'Nicolas Flamel', cnTitle: '尼可·勒梅', r2Key: 'book1/ch13' },
      { id: 'b1_c14', number: 14, title: 'Norbert the Norwegian Ridgeback', cnTitle: '挪威脊背龙诺伯', r2Key: 'book1/ch14' },
      { id: 'b1_c15', number: 15, title: 'The Forbidden Forest', cnTitle: '禁林', r2Key: 'book1/ch15' },
      { id: 'b1_c16', number: 16, title: 'Through the Trapdoor', cnTitle: '穿越活板门', r2Key: 'book1/ch16' },
      { id: 'b1_c17', number: 17, title: 'The Man with Two Faces', cnTitle: '双面人', r2Key: 'book1/ch17' },
    ]
  },
  {
    id: 'book2',
    title: "Harry Potter and the Chamber of Secrets",
    cnTitle: "哈利·波特与密室",
    code: "HP2",
    cover: "",
    color: "#1a472a",
    chapters: [
      { id: 'b2_c01', number: 1, title: 'The Worst Birthday', cnTitle: '糟糕的生日', r2Key: 'book2/ch01' },
      { id: 'b2_c02', number: 2, title: "Dobby's Warning", cnTitle: '多比的警告', r2Key: 'book2/ch02' },
      { id: 'b2_c03', number: 3, title: 'The Burrow', cnTitle: '陋居', r2Key: 'book2/ch03' },
      { id: 'b2_c04', number: 4, title: 'At Flourish and Blotts', cnTitle: '在丽痕书店', r2Key: 'book2/ch04' },
    ]
  },
  {
    id: 'book3',
    title: "Harry Potter and the Prisoner of Azkaban",
    cnTitle: "哈利·波特与阿兹卡班的囚徒",
    code: "HP3",
    cover: "",
    color: "#0e1a40",
    chapters: [
      { id: 'b3_c01', number: 1, title: 'Owl Post', cnTitle: '猫头鹰邮递', r2Key: 'book3/ch01' },
      { id: 'b3_c02', number: 2, title: "Aunt Marge's Big Mistake", cnTitle: '玛姬姑妈的大错', r2Key: 'book3/ch02' },
      { id: 'b3_c03', number: 3, title: 'The Knight Bus', cnTitle: '骑士公共汽车', r2Key: 'book3/ch03' },
    ]
  }
];

// High quality sample chapter 1 WebVTT with English & Chinese subtitles
export const SAMPLE_CHAPTER_1_VTT = `WEBVTT

00:00:01.000 --> 00:00:07.500
Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much.
家住女贞路4号的德思礼夫妇总是得意地宣称，他们是非常规矩的正常人家，多谢打听。

00:00:08.000 --> 00:00:13.800
They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.
他们最不愿与任何古怪或神秘的事物扯上干系，因为他们根本不相信这种荒唐透顶的事。

00:00:14.200 --> 00:00:19.400
Mr. Dursley was the director of a firm called Grunnings, which made drills.
德思礼先生是一家名为格朗宁的钻机制造公司的董事。

00:00:20.000 --> 00:00:26.200
He was a big, beefy man with hardly any neck, although he did have a very large moustache.
他长得膀大腰圆，几乎没有脖子，却留着一把大胡子。

00:00:27.000 --> 00:00:33.500
Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbours.
德思礼太太则身材瘦削，长着一头金发，脖子的长度几乎是常人的两倍。这在她在花园围墙上探头探脑打探邻居隐私时显得极为实用。

00:00:34.000 --> 00:00:39.500
The Dursleys had a small son called Dudley and in their opinion there was no finer boy anywhere.
德思礼夫妇有一个名叫达力的幼子，在他们眼里世上再没有比他更棒的男孩子了。

00:00:40.000 --> 00:00:45.800
The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it.
德思礼一家拥有一切所想，但他们也有一个秘密，最大的恐惧就是有人会发现它。

00:00:46.200 --> 00:00:52.500
They didn't think they could bear it if anyone found out about the Potters.
他们觉得要是有人发现波特一家的存在，他们绝对会受不了的。

00:00:53.000 --> 00:00:58.200
Mrs. Potter was Mrs. Dursley's sister, but they hadn't met for several years.
波特太太是德思礼太太的亲妹妹，但她们已经好几年没有见面了。

00:00:59.000 --> 00:01:05.500
In fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be.
事实上，德思礼太太一直装作自己根本没有妹妹，因为她妹妹和那个一无是处的丈夫与德思礼一家的行事风格截然相反。

00:01:06.000 --> 00:01:13.200
The Dursleys shuddered to think what the neighbours would say if the Potters arrived in the street.
德思礼夫妇一想到要是波特一家出现在街上邻居们会说些什么，就不寒而栗。

00:01:14.000 --> 00:01:19.500
When Mr. and Mrs. Dursley woke up on the dull, grey Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country.
在我们的故事开始的那个阴沉灰暗的星期二早晨，德思礼夫妇醒来时，窗外密布的阴云毫无迹象预示着全国各地即将发生离奇神秘的事件。

00:01:20.500 --> 00:01:26.500
Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.
德思礼先生哼着小调挑出了一条上班用的最不起眼的领带；德思礼太太则一边眉飞色舞地嚼着舌根，一边把尖叫哭闹的达力硬塞进他的高脚餐椅里。

00:01:27.500 --> 00:01:33.800
None of them noticed a large, tawny owl flutter past the window.
他们谁也没有注意到，一只黄褐色的大猫头鹰从窗前翩然掠过。

00:01:35.000 --> 00:01:42.500
At half past eight, Mr. Dursley picked up his briefcase, pecked Mrs. Dursley on the cheek, and tried to kiss Dudley good-bye but missed, because Dudley was now having a tantrum and throwing his cereal at the walls.
八点半，德思礼先生拎起公文包，在德思礼太太脸上啄吻了一下，又试图吻别达力，却没亲着，因为达力正在大发脾气，把麦片粥往墙上泼洒。

00:01:43.500 --> 00:01:47.500
"Little tyke," chortled Mr. Dursley as he left the house.
“这小淘气，”德思礼先生一边格格笑着走出家门一边嘟囔道。

00:01:48.500 --> 00:01:54.000
He got into his car and backed out of number four's drive.
他坐进小汽车，倒车驶出了四号门前的车道。

00:01:55.000 --> 00:02:02.000
It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map.
正是在街角处，他注意到了第一个异常的迹象——一只正在读地图的猫。
`;

// Demo synthesized audio generator for testing without immediate audio files
// Creates a clean, magical chime tone for speech testing or uses HTML5 SpeechSynthesis
export const SAMPLE_AUDIO_URL = 'https://assets.mixkit.co/music/preview/mixkit-hazy-after-hours-132.mp3';
