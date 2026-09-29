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

- The Botox photo endpoint accepts either one relaxed baseline image or four distinct expression images; this keeps onboarding fast without pretending one image shows expressions.
- Reuse the shared facial-lines map for both onboarding and Botox AI; one-photo onboarding results may only mark lines visible at rest because expression is unobserved.
