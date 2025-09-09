# push-game-auto.ps1
# Automatically commit and push changes with timestamp

# 1. Ensure we're on your branch
git checkout add-my-game

# 2. Stage all changes
git add .

# 3. Commit with timestamp
$time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-update: $time"

# 4. Load your SSH key
ssh-add $env:USERPROFILE\.ssh\id_ed25519

# 5. Push to org repo
git push org add-my-game
