import sys,glob
from PIL import Image, ImageDraw
files=sys.argv[2:]; out=sys.argv[1]
ims=[Image.open(f).convert('RGB').resize((195,422)) for f in files]
cols=8; rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(cols*200,rows*440),'white'); d=ImageDraw.Draw(s)
for i,(im,f) in enumerate(zip(ims,files)):
  x,y=(i%cols)*200,(i//cols)*440; s.paste(im,(x,y)); d.text((x+2,y+424),f.split('/')[-1],fill='black')
s.save(out)
