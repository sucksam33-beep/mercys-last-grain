from pathlib import Path
import shutil
import sys
import numpy as np

sys.path.insert(0,str(Path(__file__).parent/'ingredient-cleanup'))
from clean import arrays, read_glb, save_mesh

root=Path(__file__).parent
models=root/'game/assets/priority-models'
raw=root/'trellis-86-review/raw-meshes'
raw.mkdir(exist_ok=True)
for number in [171,173,138]:
    target=models/f'{number:03d}.glb'
    source=raw/target.name
    if not source.exists():
        shutil.copy2(target,source)
    metadata,buffer=read_glb(source)
    _,positions,uv,faces,_=arrays(metadata,buffer)
    points=positions[faces]
    if number in [171,173]:
        cutoff={171:-.237,173:-.246}[number]
        keep=points[:,:,1].max(1)>cutoff
    else:
        top=positions[:,[0,2]]
        area=np.linalg.norm(np.cross(points[:,1]-points[:,0],points[:,2]-points[:,0]),axis=1)
        centers=top[faces].mean(1)
        random=np.random.default_rng(138)
        best=None
        for i,j in random.integers(0,len(top),size=(1200,2)):
            delta=top[j]-top[i]
            length=np.linalg.norm(delta)
            if length<.38:
                continue
            normal=np.array([-delta[1],delta[0]])/length
            offset=top[i]@normal
            error=np.abs(centers@normal-offset)
            score=np.sum(area*np.maximum(0,1-error/.037))
            if best is None or score>best[0]:
                best=(score,normal,offset)
        _,normal,offset=best
        keep=np.abs(top[faces]@normal-offset).max(1)<.057
    kept=faces[keep]
    assert len(faces)*.15<len(kept)<len(faces)*.95
    unique,indices=np.unique(kept,return_inverse=True)
    clean=target.with_suffix('.clean.glb')
    save_mesh(clean,metadata,buffer,positions[unique],uv[unique],indices.reshape(-1,3))
    clean.replace(target)
    print(number,len(faces),len(kept))
