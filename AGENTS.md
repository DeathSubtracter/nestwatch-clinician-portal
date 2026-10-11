<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All demo data lives in `src/data/demoData.ts` behind `getDashboard()`; components never hardcode patient values — so the source can be swapped for `/demo/maya-dashboard.json` in one place.
- Frontend-only: no backend, auth, or network APIs — this is a demo for an existing external backend.
