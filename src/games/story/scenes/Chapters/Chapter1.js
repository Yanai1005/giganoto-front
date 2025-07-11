const Chapter1 = {
  chapter: "第1章",
  commonLines: [
    "……チュン、チュン……",
    "まぶたの裏で、やけにリアルな夢を見た気がする。誰かと話していた…いや、そもそも、あれは俺の声だったのか？",
    "主人公>「ふぁ……朝か…」",
    "時計は朝7時。壁に貼ったポスターの端がめくれかけている。いつもと変わらないはずの朝",
    "だけど、胸の奥にモヤが残っている。何かを忘れているような……",
    "主人公>（まぁいいか… さて、今日はどうしようか？）",
  ],
  choices: {
    logic: [
      "学校の準備をする",
      "朝食を食べる"
    ],
    impulse: [
      "二度寝する",
      "外に出る",
    ]
  },
  results: {
    logic_1: [
      "主人公>（とりあえず準備するか。）",
      '玄関',
      "主人公>「忘れ物はないな。行こう」",
      '通学路',
      '校門',
    ],
    logic_2: [
      "主人公>（とりあえず準備するか。）",
      '玄関',
      "主人公>「忘れ物はないな。行こう」",
      '通学路',
      '校門',
    ],
    impulse_1: [
      "主人公>（授業までまだ時間あるし、だるいから少し寝るかぁ）",
      "主人公>（やっべ、ちょっと寝すぎたか...だりぃけど一応学校には行くべきか。怪しまれてもメンドウだしな。）",
    ],
    impulse_2: [
      "主人公>（夢のことが気になって落ち着かないな...授業まではまだ時間があるし、外に出て気分転換するか。）",
      "主人公>（そうだ！スタバに行くか！！期間限定の抹茶ソーダフラペチーノ気になってたんだよな〜 ）",
      '街中',
      "主人公>「…冷たい風が気持ちいいな」",
      "眠気の残る頭に、朝の空気が心地よく沁みていく。日差しも少し柔らかくて、世界がクリアに感じられる。",
      "主人公>「やっぱ外に出てよかったかもな」",
      'カフェ',
      " 駅前のスタバはちょうど開店したばかり。店内には数人の学生とサラリーマン。俺は迷わず限定の抹茶ソーダフラペチーノを注文する。",
      "主人公>（まっっっっず！ …苦みと強い炭酸が押し寄せてきた後にほんのり甘さを感じるのが気持ち悪い...）",
      "主人公>（今度陽翔に飲ませるか。）",
      "カフェで落ち着いていると、頭の中の声をふと思い出す。",
      "？>「お前、そんな風に生きてて楽しいか？」",
      "主人公>（…あれはどういう意味だったんだ。）",
      "主人公>（ん？）",
      "時計を確認すると、登校時間が近づいていた。少し迷った末、俺は大学へと向かった。",
      "主人公>（……そろそろ行くか）",
      '通学路',
      '校門'
    ]
  }
};

export default Chapter1;