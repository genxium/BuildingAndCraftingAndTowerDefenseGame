upsert recipes to sqlite from txt:
```$xslt
     go run load_recipe.go -txtFile=./equations.txt -dbFile=./preconfigured.test.sqlite -U
```

load recipes to txt:
```$xslt
     go run load_recipe.go -txtFile=./equations.txt -dbFile=./preconfigured.test.sqlite
```