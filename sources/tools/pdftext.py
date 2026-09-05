import re, zlib, sys
def unesc(s):
    out=bytearray(); i=0
    while i<len(s):
        c=s[i]
        if c==0x5c:
            i+=1
            if i>=len(s): break
            n=s[i]; mm={0x6e:10,0x72:13,0x74:9,0x62:8,0x66:12}
            if n in mm: out.append(mm[n])
            elif 0x30<=n<=0x37:
                o=chr(n)
                while i+1<len(s) and 0x30<=s[i+1]<=0x37 and len(o)<3:
                    i+=1; o+=chr(s[i])
                out.append(int(o,8)&0xff)
            else: out.append(n)
        else: out.append(c)
        i+=1
    return bytes(out)

def parse_cmap(buf):
    mp={}
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', buf, re.S):
        for a,b in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            mp[int(a,16)]=''.join(chr(int(b[i:i+4],16)) for i in range(0,len(b),4))
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', buf, re.S):
        for a,b,c in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            lo,hi,st=int(a,16),int(b,16),int(c,16)
            for i in range(hi-lo+1): mp[lo+i]=chr(st+i)
    return mp

def extract(path):
    data=open(path,'rb').read()
    objs={}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj(.*?)endobj', data, re.S):
        objs[int(m.group(1))]=m.group(3)
    def stream_of(n):
        m=re.search(rb'stream\r?\n(.*?)endstream', objs[n], re.S)
        if not m: return b''
        try: return zlib.decompress(m.group(1))
        except Exception: return m.group(1)
    cmaps={}
    for n,b in objs.items():
        m=re.search(rb'/ToUnicode\s+(\d+)\s+0\s+R', b)
        if m: cmaps[n]=parse_cmap(stream_of(int(m.group(1))))
    out=[]
    for n,b in objs.items():
        if b'/Type/Page' not in b.replace(b' ',b''): continue
        rm=re.search(rb'/Font\s+(\d+)\s+0\s+R', b); cm=re.search(rb'/Contents\s+(\d+)\s+0\s+R', b)
        if not cm: continue
        res={}
        if rm:
            for a,num in re.findall(rb'/(R?\w+)\s+(\d+)\s+0\s+R', objs[int(rm.group(1))]):
                res[b'/'+a]=int(num)
        dec=stream_of(int(cm.group(1))); cur=None; parts=[]
        for tok in re.finditer(rb'/\w+(?=[\s\d.\-]+Tf)|\((?:\\.|[^\\()])*\)|Td|TD|T\*', dec, re.S):
            t=tok.group(0)
            if t.startswith(b'/'): cur=res.get(t)
            elif t.startswith(b'('):
                raw=unesc(t[1:-1]); mp=cmaps.get(cur)
                parts.append(''.join(mp.get(x,'') for x in raw) if mp else raw.decode('latin-1'))
            else: parts.append('\n')
        out.append((n, re.sub(r'\n{3,}','\n\n',''.join(parts))))
    out.sort()
    return '\n'.join(f"===== PAGE OBJ {n} =====\n{t}" for n,t in out)

if __name__=='__main__':
    print(extract(sys.argv[1]))
