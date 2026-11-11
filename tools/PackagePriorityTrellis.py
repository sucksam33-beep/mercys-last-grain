import html, json, pathlib, zipfile
from PIL import Image, ImageDraw, ImageFont, ImageOps

out=pathlib.Path(__file__).parent/'trellis-86-review'
rows=json.loads((out/'results.json').read_text(encoding='utf-8-sig'))
cleanup={138:'겹쳐 있던 창 한 자루 제거',171:'메시에 포함된 바닥 면 제거',173:'메시에 포함된 바닥 면 제거'}
for row in rows:
    if row['number'] in cleanup:
        row['localCleanup']=cleanup[row['number']]
applied=sum(bool(r.get('preview')) for r in rows)
font_path=r'C:\Windows\Fonts\malgun.ttf'
bold_path=r'C:\Windows\Fonts\malgunbd.ttf'
ink='#f3e9d6'
muted='#c1b6a2'

def tile(row, width=360, height=206):
    card=Image.new('RGB',(width,height),'#332f29')
    draw=ImageDraw.Draw(card)
    title=ImageFont.truetype(bold_path,15)
    small=ImageFont.truetype(font_path,11)
    half=width//2
    draw.text((10,6),f"{row['rank']:02d}  {row['name']}",font=title,fill=ink)
    for index,(path,label) in enumerate([(row['before'],row['beforeType']),(row.get('preview'),'Trellis 적용' if row.get('preview') else '미적용')]):
        x=index*half+5
        draw.rounded_rectangle((x,30,x+half-10,height-24),radius=4,fill='#464139')
        if path:
            with Image.open(out/path) as original:
                image=ImageOps.contain(original.convert('RGBA'),(half-17,height-62))
                card.paste(image,(x+(half-10-image.width)//2,30+(height-54-image.height)//2),image)
        draw.text((x+5,height-21),label,font=small,fill=muted if index==0 else ink)
    return card

pairs=out/'item-comparisons'
sheets=out/'comparison-sheets'
pairs.mkdir(exist_ok=True)
sheets.mkdir(exist_ok=True)
for row in rows:
    row['comparison']=f"item-comparisons/{row['rank']:02d}-{row['number']:03d}.png"
    tile(row).save(out/row['comparison'],optimize=True)

def sheet(subset,columns,width,height,name):
    body=Image.new('RGB',(columns*(width+6)+12,67+((len(subset)+columns-1)//columns)*(height+6)),'#24211e')
    draw=ImageDraw.Draw(body)
    draw.text((13,9),'Mercy · Trellis 전후 비교',font=ImageFont.truetype(bold_path,22),fill=ink)
    draw.text((13,40),f"{subset[0]['rank']:02d}–{subset[-1]['rank']:02d} · 왼쪽 기존 이미지 / 오른쪽 적용 모델 렌더",font=ImageFont.truetype(font_path,13),fill=muted)
    for i,row in enumerate(subset):
        body.paste(tile(row,width,height),(6+(i%columns)*(width+6),65+(i//columns)*(height+6)))
    body.save(out/name,optimize=True)

for start in range(0,len(rows),12):
    sheet(rows[start:start+12],3,360,206,f'comparison-sheets/{start//12+1:02d}.png')
sheet(rows,6,292,169,'all-86-contact-sheet.png')

escape=html.escape
cards=[]
for row in rows:
    metadata=f"Trellis · {escape(row.get('requestId','요청 ID 없음'))}"
    link=f'<a href="{escape(row["url"],quote=True)}">GLB 원본</a>' if row.get('url') else ''
    if row.get("localCleanup"):
        metadata+=f" · {escape(row['localCleanup'])}"
    cards.append(f'<article><a href="{row["comparison"]}"><img loading="lazy" src="{row["comparison"]}" alt="{escape(row["name"])} 전후 비교"></a><p>{metadata} {link}</p></article>')
sections=[]
for screen,label in [('bag','가방'),('codex','물고기 도감')]:
    sources=[out/f'{stage}-{screen}.png' for stage in ['before','after']]
    if not all(source.exists() for source in sources):
        continue
    crop=(430,164,1010,735)
    pane_w,pane_h=crop[2]-crop[0],crop[3]-crop[1]
    board=Image.new('RGB',(pane_w*2+30,pane_h+69),'#24211e')
    draw=ImageDraw.Draw(board)
    draw.text((10,7),label+' · 게임 화면',font=ImageFont.truetype(bold_path,23),fill=ink)
    for i,(source,label) in enumerate(zip(sources,['적용 전','적용 후'])):
        x=10+i*(pane_w+10)
        draw.text((x,40),label,font=ImageFont.truetype(font_path,15),fill=muted)
        with Image.open(source) as image:
            board.paste(image.crop(crop),(x,59))
    board.save(out/f'{screen}-before-after.png',optimize=True)
for screen,label in [('bag','가방'),('codex','물고기 도감'),('fish-detail','피라미 상세')]:
    if all((out/f'{stage}-{screen}.png').exists() for stage in ['before','after']):
        sections.append(f'<h3>{label}</h3><div class="screens">'+''.join(f'<figure><figcaption>{txt}</figcaption><a href="{stage}-{screen}.png"><img loading="lazy" src="{stage}-{screen}.png" alt="{label} {txt}"></a></figure>' for stage,txt in [('before','적용 전'),('after','적용 후')])+'</div>')
page='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mercy Trellis 86종 전후 비교</title>
<style>body{background:#24211e;color:#f3e9d6;font:16px system-ui;margin:24px auto;max-width:1300px;padding:0 18px}a{color:#efd3a7}img{display:block;width:100%;height:auto}figure{margin:0}.screens,.items{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr))}.screens{grid-template-columns:repeat(auto-fit,minmax(min(100%,490px),1fr))}article p{font-size:12px;overflow-wrap:anywhere;margin:4px 0 8px}</style>
<h1>Mercy · Trellis 86종 전후 비교</h1>'''
page+=f'<p>적용 {applied} / {len(rows)} · 번호는 사용 빈도와 게임 초반 활용도를 기준으로 정한 제출 우선순위입니다.</p><p><a href="all-86-contact-sheet.png">전체 시트</a> · <a href="results.json">전체 목록과 요청 기록</a></p>'
if sections:
    page+='<h2>게임 캡처</h2>'+''.join(sections)
page+='<h2>항목별 비교</h2><div class="items">'+''.join(cards)+'</div></html>'
(out/'comparison.html').write_text(page,encoding='utf-8')
(out/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
dest=out.parent/'mercy-trellis-86-comparisons.zip'
with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=4) as z:
    for p in [*pairs.glob('*.png'),*sheets.glob('*.png'),*(out/'before').glob('*'),*(out/'model-renders').glob('*.png'),*out.glob('*.png'),*out.glob('headless-*.json'),out/'comparison.html',out/'results.json']:
        z.write(p,p.relative_to(out))
print(f"{len(rows)} comparisons, {applied} applied, {dest}")
