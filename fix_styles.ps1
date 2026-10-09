$content = Get-Content 'C:\Users\Admin\Documents\Cours de L3\Stage\MountainsTechFrontend\MountainsTech\src\styles.scss' -Raw
$content = $content -replace '(?<=--bs-body-font-family: '"'"'Roboto'"'"';)(\s*)\.dark', '}$1.dark'
Set-Content 'C:\Users\Admin\Documents\Cours de L3\Stage\MountainsTechFrontend\MountainsTech\src\styles.scss' -Value $content