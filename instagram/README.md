# Mountain Rangers – Instagram designs

iOS "Liquid Glass" style designs, built as HTML and rendered to PNG with headless Chromium.

| Folder | Design | Size |
| --- | --- | --- |
| `apple-picking/` | Post / carousel cover (`apple-picking-post.png`) | 1080×1440 |
| | Carousel slide 2 – what to bring (`apple-picking-slide-2.png`) | 1080×1440 |
| | Carousel slide 3 – invite card (`apple-picking-slide-3.png`) | 1080×1440 |
| | Story (`apple-picking-story.png`) | 1080×1920 |
| `highlights/` | Highlight covers (`highlight-*.png`) + overview board | 1080×1920 |

## Re-rendering

Edit the text in the `.html` file, then from this folder:

```sh
node render.mjs          # everything
node render.mjs story    # only outputs whose name contains "story"
```

`shared/glass.js` is the glass renderer, `shared/base.css` the shared type and components.
Fonts: Inter / Inter Display must be installed locally.
