# New GitHub Repository Setup

This package is designed for a brand-new GitHub repository. Do not copy it over the old Unity repository.

Recommended repository name: `Squatch-Crossing-Mobile`

After creating the empty repository and opening a Codespace for it:

1. Upload `Squatch-Crossing-Mobile-NewRepo.zip` into the repository root.
2. Run:

```bash
unzip -o Squatch-Crossing-Mobile-NewRepo.zip
rm Squatch-Crossing-Mobile-NewRepo.zip
git add -A
git commit -m "Initial Squatch Crossing mobile build"
git push
```

3. Open GitHub Actions. The new repository should show `Build Android APK` and `Deploy Web Game`.
4. The Android workflow produces an artifact named `Squatch-Crossing-Android` containing the debug APK.
5. To enable the browser build, set GitHub Settings > Pages > Build and deployment > Source to GitHub Actions.

No Unity license is used by this project.
