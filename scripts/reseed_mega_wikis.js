const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
  if (!supabaseKey && line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

const THEMES = [
  { slug: "daily-food", name: "毎日のごはん", description: "献立・代替食材・お弁当のリアルな工夫" },
  { slug: "products", name: "使ってよかった市販品", description: "おやつ・パン・調味料のクチコミ" },
  { slug: "eating-out", name: "外食・おでかけ", description: "チェーン店・旅行・イベントの対応" },
  { slug: "school-life", name: "園・学校との連携", description: "給食・面談・行事の乗り切り方" },
  { slug: "challenge", name: "食物負荷試験・チャレンジ", description: "負荷試験の体験談やアドバイス" },
  { slug: "skin-body", name: "スキンケア・体調管理", description: "保湿や急な肌荒れの対処法" },
  { slug: "family", name: "家族・親戚とのコミュニケーション", description: "理解を得るための工夫" },
  { slug: "milestone", name: "成長の記録と喜び", description: "食べられるようになった喜びのシェア" }
];

async function reseedMegaWikis() {
  console.log("Restoring 8 Mega-Wiki Root Entries...");
  for (const t of THEMES) {
    const { error: upsertErr } = await supabase.from("wiki_entries").upsert({
      slug: `mega-${t.slug}`,
      category: t.name,
      title: `【みんなの知恵袋】${t.name}`,
      theme_slug: t.slug,
      is_mega_wiki: true,
      is_public: true,
      sections: [],
      source_count: 0,
      summary: t.description,
    }, { onConflict: "slug" });
    
    if (upsertErr) {
      console.error(`Error restoring ${t.slug}:`, upsertErr);
    } else {
      console.log(`Restored mega-${t.slug}`);
    }
  }
  console.log("Done.");
}

reseedMegaWikis();
