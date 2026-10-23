// Development-only asset preparation. CI uses the committed assets and runs Node logic tests.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const subsetFont = require('subset-font');
const {createFont,woff2} = require('fonteditor-core');
const {createHash} = require('node:crypto');
const hash = buffer => createHash('sha256').update(buffer).digest('hex').slice(0,12);

const root = path.resolve(__dirname, '..');
const resolvePackage = (name) => {
  try { return path.dirname(require.resolve(`${name}/package.json`)); }
  catch {
    let directory = path.dirname(require.resolve(name));
    while (!require('node:fs').existsSync(path.join(directory,'package.json'))) directory = path.dirname(directory);
    return directory;
  }
};
const copy = async (source, target) => {
  await fs.mkdir(path.dirname(target), {recursive:true});
  await fs.copyFile(source, target);
};

(async () => {
  const vendor = path.join(root, 'assets/vendor');
  const fonts = path.join(root, 'assets/fonts');
  const libraries = [
    ['@popperjs/core', 'dist/umd/popper.min.js', 'popper.min.js', 'LICENSE.md'],
    ['tippy.js', 'dist/tippy-bundle.umd.min.js', 'tippy.min.js', 'LICENSE'],
    ['mark.js', 'dist/mark.min.js', 'mark.min.js', 'LICENSE'],
    ['web-vitals', 'dist/web-vitals.iife.js', 'web-vitals.js', 'LICENSE']
  ];
  const versions = [];
  for (const [pkg, file, output, license] of libraries) {
    const base = resolvePackage(pkg);
    await copy(path.join(base, file), path.join(vendor, output));
    await copy(path.join(base, license), path.join(vendor, `${output}.LICENSE`));
    versions.push(`${pkg}@${JSON.parse(await fs.readFile(path.join(base, 'package.json'))).version}`);
  }

  let css = '';
  for (const family of ['barlow', 'roboto-mono']) {
    const base = resolvePackage(`@fontsource/${family}`);
    for (const weight of [200,400,500,600]) {
      for (const style of ['normal','italic']) {
        const filename = `${family}-latin-${weight}-${style}.woff2`;
        await copy(path.join(base,'files',filename), path.join(fonts,filename));
        const version = hash(await fs.readFile(path.join(fonts,filename)));
        css += `@font-face{font-family:'${family==='barlow'?'Barlow':'Roboto Mono'}';font-style:${style};font-weight:${weight};font-display:swap;src:url('../fonts/${filename}?v=${version}') format('woff2');}\n`;
      }
    }
    await copy(path.join(base, 'LICENSE'), path.join(fonts, `${family}.LICENSE`));
    versions.push(`@fontsource/${family}@${JSON.parse(await fs.readFile(path.join(base,'package.json'))).version}`);
  }
  await fs.writeFile(path.join(root, '_styles/fonts.scss'), css);

  const fa = resolvePackage('@fortawesome/fontawesome-free');
  let icons = await fs.readFile(path.join(fa,'css/all.min.css'),'utf8');
  icons = icons.replace(/,url\([^)]*\.ttf\) format\("truetype"\)/g, '').replaceAll('../webfonts/', '../fonts/');
  // Keep exactly the same glyphs, but omit icons the site never uses.
  let iconSources = '';
  const ignored = new Set(['.git','_site','.jekyll-cache','.sass-cache','assets','images','node_modules','.bundle','vendor','docs','tests','scripts']);
  const readIconSources = async directory => {
    for (const entry of await fs.readdir(directory,{withFileTypes:true})) {
      const file = path.join(directory,entry.name);
      if (entry.isDirectory() && !ignored.has(entry.name)) await readIconSources(file);
      else if (/\.(html|md|yaml|js|scss)$/.test(entry.name) && entry.name !== 'icons.scss') iconSources += await fs.readFile(file,'utf8');
    }
  };
  await readIconSources(root);
  const usedIcons = new Set(iconSources.match(/\bfa-[a-z0-9-]+/g));
  const codepoints = new Set([...iconSources.matchAll(/\\(f[0-9a-f]{3})\b/g)].map(m=>m[1]));
  icons = icons.replace(/([^{}]+)\{([^{}]+)\}/g,(rule,selector,body)=>{
    const glyph = body.match(/(?:content|--fa):"\\([0-9a-f]+)"/);
    if (!glyph) return rule;
    const used = [...selector.matchAll(/\.(fa-[a-z0-9-]+)/g)].some(m=>usedIcons.has(m[1]));
    if (!used) return '';
    codepoints.add(glyph[1]);
    return rule;
  });
  if (codepoints.size < 30) throw new Error('Icon extraction failed; refusing to generate incomplete fonts.');
  const glyphs = [...codepoints].map(code=>String.fromCodePoint(parseInt(code,16))).join('');
  await woff2.init();
  for (const file of (await fs.readdir(path.join(fa,'webfonts'))).filter(f=>f.endsWith('.woff2'))) {
    const buffer = await fs.readFile(path.join(fa,'webfonts',file));
    const font = createFont(await subsetFont(buffer,glyphs,{targetFormat:'sfnt'}),{type:'ttf',hinting:true});
    // OFL reserves the original family name for unmodified fonts. Preserve
    // copyright attribution while giving the modified subset its own name.
    for (const field of ['fontFamily','fullName','uniqueSubFamily','postScriptName']) {
      if (font.get().name[field]) font.get().name[field] = font.get().name[field].replaceAll('Font Awesome','NEUIR Icons').replaceAll('FontAwesome','NEUIRIcons');
    }
    const subset = Buffer.from(font.write({type:'woff2',hinting:true}));
    await fs.writeFile(path.join(fonts,file),subset);
    icons = icons.replaceAll(`../fonts/${file}`,`../fonts/${file}?v=${hash(subset)}`);
  }
  icons = icons.replaceAll('"Font Awesome','"NEUIR Icons').replaceAll('"FontAwesome','"NEUIRIcons');
  await copy(path.join(fa,'LICENSE.txt'),path.join(fonts,'fontawesome.LICENSE'));
  await fs.writeFile(path.join(root,'_styles/icons.scss'), icons);
  versions.push(`@fortawesome/fontawesome-free@${JSON.parse(await fs.readFile(path.join(fa,'package.json'))).version}`);
  versions.push(`subset-font@${JSON.parse(await fs.readFile(path.join(resolvePackage('subset-font'),'package.json'))).version} (build tool only)`);
  versions.push(`fonteditor-core@${JSON.parse(await fs.readFile(path.join(resolvePackage('fonteditor-core'),'package.json'))).version} (build tool only; OFL subset family renamed NEUIR Icons)`);
  await fs.writeFile(path.join(vendor,'VERSIONS.txt'), versions.join('\n')+'\n');
  const assetHashes = {};
  for (const folder of [fonts,vendor]) for (const file of await fs.readdir(folder)) {
    if (!/\.(woff2|js)$/.test(file)) continue;
    assetHashes[path.relative(root,path.join(folder,file))] = hash(await fs.readFile(path.join(folder,file)));
  }
  await fs.writeFile(path.join(root,'_data/asset_hashes.json'),JSON.stringify(assetHashes,null,2)+'\n');

  const imageRoot = path.join(root,'images');
  for (const folder of ['headshots','projects']) {
    for (const file of await fs.readdir(path.join(imageRoot,folder))) {
      if (!/\.(webp|jpg|png|jpeg)$/i.test(file)) continue;
      const source = path.join(imageRoot,folder,file);
      const meta = await sharp(source).metadata();
      if (meta.pages && meta.pages > 1) continue;
      const sizes = folder==='headshots' ? [360] : [480,960];
      for (const width of sizes) {
        if (meta.width <= width) continue;
        const target = path.join(imageRoot,'thumbnails',folder,`${path.parse(file).name}-${width}.webp`);
        await fs.mkdir(path.dirname(target),{recursive:true});
        await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:85,effort:6}).toFile(target);
      }
    }
  }
  await sharp(path.join(imageRoot,'logo.webp')).resize(32,32).png().toFile(path.join(imageRoot,'favicon-32.png'));
  await sharp(path.join(imageRoot,'logo.webp')).resize(180,180).png().toFile(path.join(imageRoot,'apple-touch-icon.png'));
  for (const width of [160,320]) await sharp(path.join(imageRoot,'logo.webp')).resize(width,width).webp({quality:90}).toFile(path.join(imageRoot,`logo-${width}.webp`));
  // Header/footer originals are kept for full resolution views.
  for (const source of ['images/school.webp','images/posts/2026-07-08-modelbest-neu-lab/unveiling.webp']) {
    for (const width of [960,1920]) {
      const target = path.join(root,source.replace('images/','images/thumbnails/backgrounds/').replace(/\.[^.]+$/,`-${width}.webp`));
      await fs.mkdir(path.dirname(target),{recursive:true});
      await sharp(path.join(root,source)).resize({width,withoutEnlargement:true}).webp({quality:84,effort:6}).toFile(target);
    }
  }
  const metadata = {};
  const walk = async directory => {
    for (const entry of (await fs.readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
      const file = path.join(directory,entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.(webp|png|jpe?g|gif|svg)$/i.test(entry.name)) {
        const image = await sharp(file).metadata();
        metadata[path.relative(root,file).split(path.sep).join('/')] = {width:image.width,height:image.height};
      }
    }
  };
  await walk(imageRoot);
  await fs.writeFile(path.join(root,'_data/image_metadata.json'),JSON.stringify(metadata,null,2)+'\n');
  console.log('Prepared local vendor libraries, fonts, icons, thumbnails, and favicons.');
})().catch(error=>{console.error(error);process.exitCode=1;});
