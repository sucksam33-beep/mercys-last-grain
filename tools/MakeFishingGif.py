from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root = Path(__file__).parent / "comparison" / "campaign-playthrough"
source = root / "fishing-frames"
results = json.loads((source / "results.json").read_text(encoding="utf-8"))
font = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 20)
small = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 15)
frames = []
for index in range(7):
    sheet = Image.new("RGB", (1040, 390), "#161e1a")
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 8), "아사기  ·  현장 메뉴에서 얕은 물 낚시", fill="#f6ead0", font=font)
    for column, (phase, name) in enumerate([("before", "수정 전"), ("after", "수정 후")]):
        x = 16 + column * 512
        with Image.open(source / f"{phase}-{index}.png") as image:
            sheet.paste(image.convert("RGB").resize((496, 310), Image.Resampling.LANCZOS), (x, 58))
        suffix = f" · 어획 {results[phase]['caught']}마리" if index == 6 else ""
        draw.text((x, 34), name + suffix, fill="#e4c98e", font=small)
    frames.append(sheet.quantize(colors=256))
frames[0].save(root / "fishing-before-after.gif", save_all=True, append_images=frames[1:],
               duration=[850, 210, 210, 210, 210, 210, 1400], loop=0, disposal=2)
