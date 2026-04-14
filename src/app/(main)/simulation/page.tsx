"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, BookOpen, MessageCircle, Bookmark } from "@/components/icons";

/**
 * 🧪 シミュレーション結果プレビューページ
 * 
 * ダミー会話から生成されたWiki記事JSONを、
 * 実際のWiki記事UIでプレビューできるページ。
 */

// シミュレーション結果データ（simulation-output の結果を埋め込み）
const SIMULATION_DATA: Record<string, { theme: string; input_messages: number; generated_sections: Section[] }> = {
  "daily-food": {
    "theme": "毎日のごはん",
    "input_messages": 12,
    "generated_sections": [
      {
        "heading": "おやつ",
        "items": [
          {
            "title": "米粉とバナナのパンケーキ",
            "content": "卵アレルギーの子ども向けのおやつとして、米粉とバナナだけで作るパンケーキが良いという報告があります。",
            "allergen_free": [
              "卵"
            ],
            "mention_count": 2,
            "heat_score": 0,
            "tips": [
              "豆乳ヨーグルトを加えると、しっとりして美味しくなる",
              "ココナッツオイルで焼くとサクサクになる",
              "冷凍保存してお弁当にも使える"
            ],
            "is_recommended": true
          },
          {
            "title": "タピオカ粉のポンデケージョ",
            "content": "タピオカ粉で作るポンデケージョは、チーズアレルギーがなければおすすめ。小麦粉不使用でグルテンフリー。",
            "allergen_free": [
              "卵",
              "小麦"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": true
          }
        ]
      },
      {
        "heading": "弁当",
        "items": [
          {
            "title": "かぼちゃの茶巾",
            "content": "卵焼きの代わりにかぼちゃの茶巾を入れるという声があります。見た目も卵焼きに似ていて、子供にも好評。作り方は、かぼちゃを加熱して潰し、ラップで包んで絞るだけ。",
            "allergen_free": [
              "卵"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "さつまいもスティック",
            "content": "さつまいもスティックは、オーブンで焼くだけで甘くて子供が喜ぶ。",
            "allergen_free": [],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": true
          },
          {
            "title": "ツナとコーンのおにぎり",
            "content": "ツナとコーンのおにぎりは定番。マヨネーズはキューピーのエッグケアを使用。",
            "allergen_free": [
              "卵 (マヨネーズによる)"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "朝食",
        "items": [
          {
            "title": "オーバーナイトオーツ",
            "content": "オートミールに豆乳をかけて一晩冷蔵庫に入れておくオーバーナイトオーツは、朝食に便利。",
            "allergen_free": [],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": true
          },
          {
            "title": "納豆ごはん",
            "content": "納豆ごはんに海苔を巻くだけでも栄養が摂れる。味噌汁があれば完璧。",
            "allergen_free": [],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "米粉と豆乳の蒸しパン",
            "content": "米粉と豆乳で蒸しパンを作り、冷凍ストックしておくと、レンジで温めるだけで朝食に便利。",
            "allergen_free": [
              "卵",
              "小麦"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "夕食",
        "items": [
          {
            "title": "れんこんハンバーグ",
            "content": "ハンバーグのつなぎに卵の代わりとして、れんこんのすりおろしを入れるという声があります。もちもちして美味しいという感想も。",
            "allergen_free": [
              "卵"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      }
    ]
  },
  "products": {
    "theme": "使ってよかった市販品",
    "input_messages": 10,
    "generated_sections": [
      {
        "heading": "パン",
        "items": [
          {
            "title": "米粉パン",
            "brand": "日本ハム みんなの食卓",
            "content": "トーストするとサクサクでおいしいという声があります。冷凍保存可能。イオンで買えるという情報があります。",
            "allergen_free": [],
            "where_to_buy": [
              "イオン"
            ],
            "mention_count": 2,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": true
          },
          {
            "title": "お米のパン",
            "brand": "タイナイ",
            "content": "少しもっちりした食感でおいしいという声があります。Amazonで購入可能。",
            "allergen_free": [],
            "where_to_buy": [
              "Amazon"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          },
          {
            "title": "食パン",
            "brand": "シャール",
            "content": "卵乳フリーでおいしいという声があります。ドイツの会社で品質が高いという情報があります。カルディで見かけるという情報があります。",
            "allergen_free": [
              "卵",
              "乳"
            ],
            "where_to_buy": [
              "カルディ"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "おやつ",
        "items": [
          {
            "title": "クッキー類",
            "brand": "辻安全食品",
            "content": "28品目不使用で信頼できるという声があります。味もおいしいという情報があります。",
            "allergen_free": [],
            "where_to_buy": [],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          },
          {
            "title": "ハイハイン",
            "brand": "亀田",
            "content": "赤ちゃんの頃からお世話になっているという声があります。国産米100%で安心、コスパが良いという情報があります。",
            "allergen_free": [],
            "where_to_buy": [],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          },
          {
            "title": "アンパンマンのおせんべい",
            "brand": null,
            "content": "28品目不使用で子供が好きという声があります。スーパーでどこでも売っていて助かるという情報があります。",
            "allergen_free": [],
            "where_to_buy": [
              "スーパー"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          },
          {
            "title": "ノンアレクッキー",
            "brand": "太田油脂",
            "content": "素朴でおいしいという声があります。楽天で箱買いしているという情報があります。",
            "allergen_free": [],
            "where_to_buy": [
              "楽天"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "調味料",
        "items": [
          {
            "title": "エッグケア",
            "brand": "キューピー",
            "content": "味は普通のマヨネーズとほぼ変わらないという声があります。サラダにもお弁当にも使えて万能という情報があります。",
            "allergen_free": [],
            "where_to_buy": [],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          },
          {
            "title": "有機みそ",
            "brand": "創健社",
            "content": "大豆アレルギーの子は使えないが、添加物なしで安心という声があります。",
            "allergen_free": [],
            "where_to_buy": [],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          }
        ]
      }
    ]
  },
  "eating-out": {
    "theme": "外食・おでかけ",
    "input_messages": 10,
    "generated_sections": [
      {
        "heading": "ファミレス",
        "items": [
          {
            "title": "ココス",
            "content": "アレルギー対応メニューが充実しており、低アレルゲンメニューとして卵・乳・小麦・えび・かに・そば・落花生不使用のキッズプレートが提供されているという報告があります。",
            "allergy_menu": true,
            "safe_items": [
              "低アレルゲンキッズプレート"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": true
          },
          {
            "title": "ガスト",
            "content": "アレルギー情報をタブレットで確認でき、店員に伝えると厨房で別調理してくれるという報告があります。",
            "allergy_menu": true,
            "safe_items": [],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": true
          },
          {
            "title": "サイゼリヤ",
            "content": "アレルゲン表が充実しており、ドリアやグラタンを避ければ食べられるものが多いという報告があります。コスパが良い点も評価されています。",
            "allergy_menu": true,
            "safe_items": [],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "回転寿司",
        "items": [
          {
            "title": "くら寿司",
            "content": "皿ごとのアレルゲン情報がアプリで見られるため安心という声があります。ネタによっては卵不使用の握りも選択可能です。",
            "allergy_menu": true,
            "safe_items": [
              "卵不使用の握り"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          },
          {
            "title": "スシロー",
            "content": "アレルゲン表を入手可能。刺身のみを食べるという人もいますが、同じ場所で食事できることが嬉しいという声があります。",
            "allergy_menu": true,
            "safe_items": [
              "刺身"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "テーマパーク",
        "items": [
          {
            "title": "ディズニーランド",
            "content": "アレルギー対応レストランが複数あり、事前にキャストに伝えれば個別対応してくれるという報告があります。低アレルゲンメニューも用意されています。",
            "allergy_menu": true,
            "safe_items": [
              "低アレルゲンメニュー"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": true
          },
          {
            "title": "USJ",
            "content": "アレルギー対応が改善され、アレルギー対応セットがいくつか用意されており、Webで事前確認も可能という報告があります。",
            "allergy_menu": true,
            "safe_items": [
              "アレルギー対応セット"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "ファストフード",
        "items": [
          {
            "title": "モスバーガー",
            "content": "低アレルゲンメニューがあり、専用の調理エリアで作ってくれるため安心感があるという声があります。",
            "allergy_menu": true,
            "safe_items": [
              "低アレルゲンメニュー"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": true
          },
          {
            "title": "マクドナルド",
            "content": "アレルゲン表はあるものの、フライヤーが共有であるため、厳密に除去している家庭は注意が必要という情報があります。ポテトのみであれば大丈夫かもしれないという意見もあります。",
            "allergy_menu": true,
            "safe_items": [
              "ポテト"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "旅行先",
        "items": [
          {
            "title": "ルネッサンスリゾートオキナワ",
            "content": "沖縄旅行で、アレルギー対応のホテルが増えており、ルネッサンスリゾートオキナワは事前に相談すると個別対応してくれるという報告があります。",
            "allergy_menu": true,
            "safe_items": [],
            "mention_count": 1,
            "heat_score": 0,
            "reviews": [],
            "is_recommended": true
          }
        ]
      }
    ]
  },
  "school": {
    "theme": "園・学校との連携",
    "input_messages": 8,
    "generated_sections": [
      {
        "heading": "入園前の準備",
        "items": [
          {
            "title": "アレルギー情報の伝え方",
            "content": "入園前面談で、かかりつけ医の診断書と生活管理指導表を提出したというケースが報告されています。先生が丁寧に対応してくれたとのことです。",
            "documents_needed": [
              "診断書",
              "生活管理指導表"
            ],
            "negotiation_phrases": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          },
          {
            "title": "アレルギーに関する一覧表の作成",
            "content": "写真付きの一覧表を作成したというケースが報告されています。「この子はこれが食べられません」「代わりにこれを持参します」という情報を紙1枚にまとめたものが、先生から好評だったとのことです。",
            "documents_needed": [],
            "negotiation_phrases": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": true
          }
        ]
      },
      {
        "heading": "給食対応",
        "items": [
          {
            "title": "代替弁当の工夫",
            "content": "給食の代替弁当を作るのが大変という声があります。園から前月に献立がもらえる場合、献立に似た見た目のお弁当を作るという工夫をしている人がいるようです。",
            "documents_needed": [],
            "negotiation_phrases": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          },
          {
            "title": "除去食対応",
            "content": "園によっては除去食に対応してくれるケースが報告されています。栄養士さんと月1回打ち合わせをして、食材のOK/NGを確認しているという声もあります。",
            "documents_needed": [],
            "negotiation_phrases": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": true
          }
        ]
      },
      {
        "heading": "遠足・行事",
        "items": [
          {
            "title": "おやつ交換への対応",
            "content": "遠足のおやつ交換が心配な場合、先生に事前に伝えて、子供に別のおやつ袋を用意してもらうという対応をした人がいるようです。",
            "documents_needed": [],
            "negotiation_phrases": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": true
          },
          {
            "title": "誕生日ケーキの手配",
            "content": "園にアレルギー対応のケーキ（シャトレーゼなど）をお願いしたところ、快く受けてくれたというケースが報告されています。みんなと同じケーキで子供が喜んだとのことです。",
            "documents_needed": [],
            "negotiation_phrases": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": true
          }
        ]
      },
      {
        "heading": "先生との関係構築",
        "items": [
          {
            "title": "アレルギー情報の書面化",
            "content": "年度始めにクラス担任が変わるたびに、改めてアレルギーの説明をするのがストレスという声があります。書面にまとめておくと楽になるという意見があります。",
            "documents_needed": [],
            "negotiation_phrases": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": true
          }
        ]
      }
    ]
  },
  "load-test": {
    "theme": "負荷試験の体験談",
    "input_messages": 8,
    "generated_sections": [
      {
        "heading": "卵",
        "items": [
          {
            "title": "試験段階/内容",
            "content": "3歳の娘が卵の経口負荷試験を受けた。固ゆで卵1/32個から始めて、30分おきに量を増やしていく",
            "allergen": "卵",
            "child_age": "3歳",
            "result": "1/32個から開始",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "試験段階/内容",
            "content": "卵の負荷試験で、朝9時に病院入りして夕方4時までかかった",
            "allergen": "卵",
            "child_age": null,
            "result": "1/8個まで食べられた",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "準備のコツ",
            "content": "負荷試験の持ち物として、着替え、おもちゃ、タブレットが必須。DVDプレーヤーも役立った",
            "allergen": "卵",
            "child_age": null,
            "result": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "試験結果",
            "content": "負荷試験後は2時間病院で待機。症状が出ず、先生から「加熱卵1/4個までは自宅でOK」と言われた",
            "allergen": "卵",
            "child_age": null,
            "result": "加熱卵1/4個まで自宅でOK",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "乳",
        "items": [
          {
            "title": "試験段階/内容",
            "content": "牛乳の負荷試験を0.1mlから開始。最初はシリンジで量を測った。5mlまではOKだったので、少しずつパンなど焼き込みから始めている",
            "allergen": "乳",
            "child_age": null,
            "result": "5mlまではOK",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "試験結果",
            "content": "牛乳5mlOKから、1年で50mlまで上がった。毎日少量を継続摂取する方法で、先生と週1で量を相談しながら進めている",
            "allergen": "乳",
            "child_age": null,
            "result": "1年で50mlまでOK",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "小麦",
        "items": [
          {
            "title": "試験段階/内容",
            "content": "小麦の負荷試験はうどん1gからスタート。4歳の息子は3gで口の周りが少し赤くなって中止になった",
            "allergen": "小麦",
            "child_age": "4歳",
            "result": "3gで中止",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "試験前の心構え",
        "items": [
          {
            "title": "親の心構え",
            "content": "親の不安が子供に伝わるので、できるだけリラックスして臨むのが大事だと先生に言われた。実際に余裕を持てた2回目のほうが子供も落ち着いていた",
            "allergen": null,
            "child_age": null,
            "result": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      }
    ]
  },
  "skin-care": {
    "theme": "肌とからだのケア",
    "input_messages": 8,
    "generated_sections": [
      {
        "heading": "保湿",
        "items": [
          {
            "title": "ヒルドイド + ワセリン",
            "content": "ヒルドイドを塗った後、ワセリンで蓋をすることで、乾燥が改善されたという報告があります。",
            "brand": null,
            "skin_type": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "プロペト（白色ワセリン）",
            "content": "ヒルドイドの後にプロペトを使用すると、翌朝までしっとり感が続くという声があります。薬局で購入可能で、大容量でコスパが良いとのことです。",
            "brand": null,
            "skin_type": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": true
          },
          {
            "title": "パックスベビー ボディクリーム",
            "content": "合成界面活性剤不使用で、敏感肌の子どもに合うという報告があります。太陽油脂の製品です。",
            "brand": "太陽油脂",
            "skin_type": "敏感肌",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "入浴",
        "items": [
          {
            "title": "お風呂の温度調整",
            "content": "お風呂の温度を38〜39度程度に設定することで、肌荒れが軽減されたという報告があります。長湯は避け、5分以内にするのが良いとのことです。",
            "brand": null,
            "skin_type": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "キュレル 入浴液",
            "content": "セラミド配合で保湿効果が期待できる入浴剤として、キュレルの「入浴液」が良いという声があります。ドラッグストアで購入可能です。",
            "brand": "キュレル",
            "skin_type": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": true
          }
        ]
      },
      {
        "heading": "かゆみ対策",
        "items": [
          {
            "title": "綿100%の手袋",
            "content": "寝ている間にかきむしる対策として、綿100%の手袋を着用させるという方法があります。ミトンだと外れてしまうため、ゴム付きの手袋が便利とのことです。",
            "brand": null,
            "skin_type": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "パジャマを裏返しに着せる",
            "content": "パジャマを裏返しに着せることで、縫い目が肌に当たるのを防ぎ、かき壊しを減らす効果が期待できるという報告があります。",
            "brand": null,
            "skin_type": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "ステロイド",
        "items": [
          {
            "title": "ステロイドの使用方法",
            "content": "ステロイドを怖がりすぎず、短期間しっかり塗り、良くなったら保湿に切り替えるというメリハリのある使い方が推奨されるという医師からのアドバイスがあったという報告があります。",
            "brand": null,
            "skin_type": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      }
    ]
  },
  "emotions": {
    "theme": "気持ち・家族・まわり",
    "input_messages": 8,
    "generated_sections": [
      {
        "heading": "診断時",
        "items": [
          {
            "title": "診断された時の気持ち",
            "content": "アレルギーと診断された時、何を食べさせればいいのか分からず、毎日泣いていたというケースが報告されています。",
            "coping_strategies": [],
            "encouraging_words": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          },
          {
            "title": "診断された時の気持ち",
            "content": "診断直後は自分を責めてばかりいたが、医師に「お母さんのせいじゃない」と言ってもらえて少し楽になったという体験が報告されています。",
            "coping_strategies": [],
            "encouraging_words": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "家族間",
        "items": [
          {
            "title": "義実家の理解",
            "content": "義母に「そんなことある？昔はそんな子いなかった」と言われて辛かったが、医師の診断書を見せたら理解してくれたというケースが報告されています。",
            "coping_strategies": [
              "医師の診断書を提示"
            ],
            "encouraging_words": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          },
          {
            "title": "義実家の理解",
            "content": "義実家が最初は理解してくれなかったが、アレルギーの冊子を渡して「命に関わる」ことを改めて説明したら、かなり気をつけてくれるようになったという体験が報告されています。",
            "coping_strategies": [
              "アレルギーに関する冊子を渡す",
              "命に関わることを説明する"
            ],
            "encouraging_words": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "ママ友との関係",
        "items": [
          {
            "title": "ママ友との関係",
            "content": "お友達の家に遊びに行くとき、アレルギーのことを伝えるのが毎回緊張するが、正直に話すと、みんな気をつけてくれるし、気にしないでと言ってくれる方が多いという声が報告されています。",
            "coping_strategies": [
              "正直にアレルギーについて話す"
            ],
            "encouraging_words": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "子どもの気持ち",
        "items": [
          {
            "title": "子どもの気持ち",
            "content": "「なんで僕だけ食べられないの？」って言われた時が一番辛いが、「体が強くなってるんだよ」って前向きに話すようにしているという体験が報告されています。",
            "coping_strategies": [
              "前向きな言葉で伝える"
            ],
            "encouraging_words": [
              "体が強くなってるんだよ"
            ],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          },
          {
            "title": "子どもの気持ち",
            "content": "5歳の子どもが自分から友達に「僕これ食べられないんだ」って言えるようになり、その成長に感動したという体験が報告されています。",
            "coping_strategies": [],
            "encouraging_words": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "メンタルケア",
        "items": [
          {
            "title": "メンタルケア",
            "content": "同じ悩みを持つ親の集まりに参加して救われたという体験が報告されています。一人じゃないと思えるだけで全然違うとのことです。",
            "coping_strategies": [
              "親の会に参加する"
            ],
            "encouraging_words": [],
            "mention_count": 1,
            "heat_score": 0,
            "is_recommended": false
          }
        ]
      }
    ]
  },
  "food-wins": {
    "theme": "食べられた！の記録",
    "input_messages": 8,
    "generated_sections": [
      {
        "heading": "卵",
        "items": [
          {
            "title": "加熱卵",
            "content": "3歳で固ゆで卵1/32個だった子が、5歳で加熱卵まるまる1個食べられるようになったというケースが報告されています。",
            "allergen": "卵",
            "child_age": "5",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "竹輪、たまごサンド",
            "content": "竹輪やランチパックのたまごサンドが食べられるようになったというケースが報告されています。コンビニで選べる幅が広がったとのことです。",
            "allergen": "卵",
            "child_age": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "乳",
        "items": [
          {
            "title": "ヨーグルト",
            "content": "牛乳アレルギーだった子が、6歳でヨーグルト50g食べられるようになったというケースが報告されています。チーズはまだ食べられないとのことです。",
            "allergen": "乳",
            "child_age": "6",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "給食",
            "content": "クラスのお友達と同じ給食が食べられるようになったというケースが報告されています。",
            "allergen": "乳",
            "child_age": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "小麦",
        "items": [
          {
            "title": "うどん",
            "content": "小麦アレルギー持ちの4歳の子が、うどん10gから始めて、今は普通にうどん一玉食べているというケースが報告されています。パンやパスタも少しずつ挑戦中とのことです。",
            "allergen": "小麦",
            "child_age": "4",
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          },
          {
            "title": "外食",
            "content": "小麦クリアしたら外食の選択肢が一気に広がったというケースが報告されています。ラーメン屋さんにも行けるようになったとのことです。",
            "allergen": "小麦",
            "child_age": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "ナッツ類",
        "items": [
          {
            "title": "ピーナッツ",
            "content": "アレルギー検査の数値は高いものの、ピーナッツの経口免疫療法で毎日微量を継続したところ、半年で摂取量が3倍に増えたというケースが報告されています。",
            "allergen": "ピーナッツ",
            "child_age": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      },
      {
        "heading": "その他",
        "items": [
          {
            "title": "IgE値の低下",
            "content": "定期的な血液検査でIgE値が年々下がってきているのを見ると希望が持てるという声があります。医師からも「順調」と言われているとのことです。",
            "allergen": null,
            "child_age": null,
            "mention_count": 1,
            "heat_score": 0,
            "tips": [],
            "is_recommended": false
          }
        ]
      }
    ]
  }
};

interface Item {
  title: string;
  content: string;
  mention_count?: number;
  heat_score?: number;
  is_recommended?: boolean;
  tips?: string[];
  allergen_free?: string[];
  where_to_buy?: string[];
  safe_items?: string[];
  brand?: string | null;
  reviews?: { rating?: number; comment?: string }[];
  // Load-test specific
  allergen?: string | null;
  child_age?: string | null;
  result?: string | null;
  // Skin-care specific
  skin_type?: string | null;
  // School specific
  documents_needed?: string[];
  negotiation_phrases?: string[];
  // Emotions specific
  coping_strategies?: string[];
  encouraging_words?: string[];
  [key: string]: unknown;
}

interface Section {
  heading: string;
  items: Item[];
}

const THEME_EMOJIS: Record<string, string> = {
  "daily-food": "🍚",
  products: "🛒",
  "eating-out": "🍽️",
  school: "🏫",
  "load-test": "🧪",
  "skin-care": "🧴",
  emotions: "👨\u200d👩\u200d👧",
  "food-wins": "🌱",
};

const THEME_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  "daily-food": { from: "from-orange-50", to: "to-amber-50", accent: "text-orange-600" },
  products: { from: "from-blue-50", to: "to-indigo-50", accent: "text-blue-600" },
  "eating-out": { from: "from-rose-50", to: "to-pink-50", accent: "text-rose-600" },
  school: { from: "from-violet-50", to: "to-purple-50", accent: "text-violet-600" },
  "load-test": { from: "from-teal-50", to: "to-cyan-50", accent: "text-teal-600" },
  "skin-care": { from: "from-[var(--color-border)]", to: "to-[var(--color-primary-bg)]", accent: "text-[var(--color-primary)]" },
  emotions: { from: "from-fuchsia-50", to: "to-pink-50", accent: "text-fuchsia-600" },
  "food-wins": { from: "from-[var(--color-primary-bg)]", to: "to-teal-50", accent: "text-[var(--color-primary-dark)]" },
};

/** Suppress duplicate title if it matches section heading */
function shouldShowTitle(sectionHeading: string, itemTitle: string): boolean {
  const normalize = (s: string) => s.replace(/[\s　]/g, '').toLowerCase();
  return normalize(sectionHeading) !== normalize(itemTitle);
}

/** Render theme-specific rich metadata for each item */
function ThemeSpecificMeta({ item, themeSlug }: { item: Item; themeSlug: string }) {
  const parts: React.ReactNode[] = [];

  // Load-test: show allergen, child_age, result
  if (themeSlug === "load-test") {
    const metas: { icon: string; label: string; value: string }[] = [];
    if (item.allergen) metas.push({ icon: "🔬", label: "アレルゲン", value: String(item.allergen) });
    if (item.child_age) metas.push({ icon: "👶", label: "年齢", value: String(item.child_age) });
    if (item.result) metas.push({ icon: "📊", label: "結果", value: String(item.result) });
    if (metas.length > 0) {
      parts.push(
        <div key="load-metas" className="mt-3 grid grid-cols-1 gap-1.5">
          {metas.map((m, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-xl border border-teal-100">
              <span className="text-sm">{m.icon}</span>
              <span className="text-[10px] font-bold text-teal-700">{m.label}:</span>
              <span className="text-[11px] font-semibold text-teal-900">{m.value}</span>
            </div>
          ))}
        </div>
      );
    }
  }

  // Skin-care: show skin_type
  if (themeSlug === "skin-care" && item.skin_type) {
    parts.push(
      <div key="skin-type" className="mt-2">
        <span className="px-2.5 py-1 bg-[var(--color-primary-bg)] text-[var(--color-primary)] rounded-full text-[10px] font-bold border border-[var(--color-border)]">
          🧴 {item.skin_type}向け
        </span>
      </div>
    );
  }

  // School: show documents_needed
  if (themeSlug === "school" && item.documents_needed && item.documents_needed.length > 0) {
    parts.push(
      <div key="docs" className="mt-3 p-2.5 bg-violet-50 rounded-xl border border-violet-100">
        <p className="text-[10px] font-bold text-violet-700 mb-1">📄 必要書類</p>
        <div className="flex flex-wrap gap-1.5">
          {item.documents_needed.map((d: string, i: number) => (
            <span key={i} className="px-2 py-0.5 bg-white text-violet-700 rounded-full text-[10px] font-semibold border border-violet-200">
              {d}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Emotions: show coping_strategies + encouraging_words
  if (themeSlug === "emotions") {
    if (item.coping_strategies && item.coping_strategies.length > 0) {
      parts.push(
        <div key="coping" className="mt-3 p-2.5 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
          <p className="text-[10px] font-bold text-fuchsia-700 mb-1.5">💪 対処法</p>
          <div className="space-y-1">
            {item.coping_strategies.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-fuchsia-400 text-[10px] mt-0.5">▸</span>
                <span className="text-[11px] text-fuchsia-800 leading-relaxed">{s}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (item.encouraging_words && item.encouraging_words.length > 0) {
      parts.push(
        <div key="encourage" className="mt-2">
          {item.encouraging_words.map((w: string, i: number) => (
            <div key={i} className="px-3 py-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 italic">
              <span className="text-[12px] text-pink-800 leading-relaxed">&ldquo;{w}&rdquo;</span>
            </div>
          ))}
        </div>
      );
    }
  }

  return parts.length > 0 ? <>{parts}</> : null;
}

export default function SimulationPreview() {
  const [selectedTheme, setSelectedTheme] = useState<string>("daily-food");
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [expandedToc, setExpandedToc] = useState(false);

  const data = SIMULATION_DATA[selectedTheme];
  const sections = data.generated_sections;
  const totalItems = sections.reduce((sum, sec) => sum + sec.items.length, 0);
  const colors = THEME_COLORS[selectedTheme] || THEME_COLORS["daily-food"];

  const scrollToSection = (idx: number) => {
    const el = document.getElementById(`section-${idx}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setExpandedToc(false);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--color-surface)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <Link href="/wiki" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-soft)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-orange-400 to-pink-500 px-2.5 py-1 rounded-full">🧪 シミュレーション</span>
          </div>
          <h1 className="text-[15px] font-bold text-[var(--color-text)] truncate break-keep text-balance mt-1">
            {THEME_EMOJIS[selectedTheme]} {data.theme}
          </h1>
        </div>
        {/* Compact Stats */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-center">
            <p className="text-[14px] font-black text-[var(--color-primary)]">{totalItems}</p>
            <p className="text-[8px] font-semibold text-[var(--color-muted)]">件</p>
          </div>
        </div>
      </div>

      {/* Theme Tab Selector with scroll fade */}
      <div className="relative">
        <div className="px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2 w-max">
            {Object.entries(SIMULATION_DATA).map(([slug, d]) => (
              <button
                key={slug}
                onClick={() => setSelectedTheme(slug)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                  selectedTheme === slug
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md scale-[1.02]"
                    : "bg-white text-[var(--color-text)] border-[var(--color-border-light)] hover:border-[var(--color-primary)]/30"
                }`}
              >
                <span className="text-base">{THEME_EMOJIS[slug]}</span>
                <span className="whitespace-nowrap">{d.theme}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Scroll fade indicators */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent pointer-events-none z-10" />
      </div>

      {/* Compact Stats + Source Banner */}
      <div className="px-4 py-2">
        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r ${colors.from} ${colors.to} border border-[var(--color-border-light)]/50`}>
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-[11px] font-bold text-[var(--color-text)]">{data.input_messages}件の声</span>
            </div>
            <span className="text-[var(--color-border-light)]">│</span>
            <span className="text-[11px] font-semibold text-[var(--color-muted)]">{sections.length}カテゴリ</span>
            <span className="text-[var(--color-border-light)]">│</span>
            <span className="text-[11px] font-semibold text-[var(--color-muted)]">{totalItems}アイテム</span>
          </div>
          <span className="trust-badge trust-low text-[9px]">
            <Shield className="w-3 h-3" />
            新しい声
          </span>
        </div>
      </div>

      {/* Table of Contents (collapsible) */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setExpandedToc(!expandedToc)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[var(--color-border-light)] hover:border-[var(--color-primary)]/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-[12px] font-bold text-[var(--color-text)]">目次 — {sections.length}カテゴリ</span>
          </div>
          <span className={`text-[var(--color-muted)] text-[12px] transition-transform ${expandedToc ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedToc && (
          <div className="mt-1 p-3 rounded-xl bg-white border border-[var(--color-border-light)] space-y-1 animate-in slide-in-from-top-2">
            {sections.map((sec, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(i)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-[var(--color-surface-soft)] transition-colors"
              >
                <span className="w-1 h-3 rounded-full bg-[var(--color-primary)]" />
                <span className="text-[12px] font-semibold text-[var(--color-text)]">{sec.heading}</span>
                <span className="text-[10px] text-[var(--color-muted)] ml-auto">{sec.items.length}件</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="px-4 pb-4">
        <div className="space-y-5 mb-6">
          {sections.map((sec, i) => (
            <div key={i} id={`section-${i}`} className="card-elevated p-4 scroll-mt-20">
              <h2 className="text-[15px] font-black tracking-tight mb-3 flex items-center gap-2 break-keep text-balance" style={{ color: 'var(--color-primary)' }}>
                <span className="w-1.5 h-4 bg-[var(--color-primary)] rounded-full inline-block" />
                {sec.heading}
                <span className="text-[10px] font-semibold text-[var(--color-muted)] ml-auto bg-[var(--color-surface)] px-2 py-0.5 rounded-full">{sec.items.length}件</span>
              </h2>
              <div className="space-y-3">
                {sec.items.map((item, j) => {
                  const showTitle = shouldShowTitle(sec.heading, item.title);
                  const itemKey = `${sec.heading}-${item.title}-${j}`;
                  const isBookmarked = bookmarked.has(itemKey);
                  
                  return (
                    <div key={j} className="p-3.5 rounded-2xl bg-[var(--color-surface-soft)] border border-[var(--color-border-light)] hover:border-[var(--color-primary)]/20 transition-colors">
                      {/* Title Row */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          {showTitle && (
                            <h3 className="text-[13px] font-bold text-[var(--color-text)] leading-snug break-keep">{item.title}</h3>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.is_recommended && (
                            <span className="text-[9px] font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 rounded-full shadow-sm">
                              👑 定番
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setBookmarked(prev => {
                                const next = new Set(prev);
                                if (next.has(itemKey)) next.delete(itemKey);
                                else next.add(itemKey);
                                return next;
                              });
                            }}
                            className={`p-1 rounded-full transition-all ${
                              isBookmarked
                                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] scale-110"
                                : "text-[var(--color-subtle)] hover:text-[var(--color-text)]"
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-[12px] text-[var(--color-subtle)] leading-[1.7] whitespace-pre-wrap">{item.content}</p>

                      {/* Brand */}
                      {item.brand && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px]">🏭</span>
                          <span className="text-[11px] font-semibold text-[var(--color-text)]">{item.brand}</span>
                        </div>
                      )}

                      {/* Theme-specific metadata */}
                      <ThemeSpecificMeta item={item} themeSlug={selectedTheme} />

                      {/* Tips */}
                      {item.tips && item.tips.length > 0 && (
                        <div className="mt-2.5 space-y-1">
                          {item.tips.map((tip, tidx) => (
                            <div key={tidx} className="flex items-start gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                              <span className="text-[var(--color-secondary)] text-[10px] mt-0.5">💡</span>
                              <span className="text-[11px] text-amber-800 leading-relaxed">{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tags Row */}
                      {((item.allergen_free && item.allergen_free.length > 0) ||
                        (item.where_to_buy && item.where_to_buy.length > 0) ||
                        (item.safe_items && item.safe_items.length > 0)) && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {item.allergen_free?.map((a, aidx) => (
                            <span key={`af-${aidx}`} className="px-2 py-0.5 bg-[var(--color-primary-bg)] text-[var(--color-primary-dark)] rounded-full text-[10px] font-bold border border-[var(--color-border-light)]">
                              🏷️ {a}不使用
                            </span>
                          ))}
                          {item.where_to_buy?.map((w, widx) => (
                            <span key={`wb-${widx}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-200">
                              🛒 {w}
                            </span>
                          ))}
                          {item.safe_items?.map((s, sidx) => (
                            <span key={`si-${sidx}`} className="px-2 py-0.5 bg-[var(--color-primary-bg)] text-[var(--color-primary)] rounded-full text-[10px] font-bold border border-[var(--color-border-light)]">
                              ✅ {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta Stats */}
                      <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[var(--color-border-light)]/40">
                        {item.mention_count && (
                          <span className="text-[10px] font-semibold flex items-center gap-1 text-[var(--color-muted)]">
                            👥 {item.mention_count}人の声
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Medical Disclaimer */}
        <div className="p-3 rounded-2xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 mb-6">
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            ⚠️ この情報は保護者の体験に基づく参考情報です。<strong>医療的な判断は必ず主治医にご相談ください。</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
