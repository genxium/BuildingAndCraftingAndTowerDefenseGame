package main

import (
	"bufio"
	"database/sql"
	"flag"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"os"
	"regexp"
	"strings"
)

type Recipe struct {
	Id                                 int32   `json:"id" db:"id"`
	DurationMillis                     int32   `json:"durationMillis" db:"duration_millis"`
	TargetIngredientId                 *int32  `json:"targetIngredientId" db:"target_ingredient_id"`
	TargetIngredientCount              *int32  `json:"targetIngredientCount" db:"target_ingredient_count"`
	ToUnlockSimultaneouslyRecipeIdList *string `json:"toUnlockSimultaneouslyRecipeIdList" db:"to_unlock_simultaneously_recipe_id_list"`
}

type RecipeIngredientBinding struct {
	Id                         int32   `json:"id" db:"id"`
	RecipeId                   int32   `json:"recipeId" db:"recipe_id"`
	IngredientId               int32   `json:"ingredientId" db:"ingredient_id"`
	Count                      int32   `json:"count" db:"count"`
	PrependedBinocularOperator *string `json:"prependedBinocularOperator" db:"prepended_binocular_operator"`
}

func upsertRecipe(db *sql.DB, str string, recipeId int32, startedBindingId *int32, unlockRecipeIds string) Recipe {
	var recipe Recipe
	var durationMillis int32
	bindingRegexp, _ := regexp.Compile("\\d+\\*\\d+")
	targetBindingList := bindingRegexp.FindAllString(str, -1)
	_, err := fmt.Sscanf(str, "&(%d)", &durationMillis)
	if err != nil {
		log.Fatal(err)
	}
	recipe.DurationMillis = durationMillis
	if len(targetBindingList) == 1 {
		var ingredientId int32
		var count int32
		_, err := fmt.Sscanf(targetBindingList[0], "%d*%d", &ingredientId, &count)
		recipe.TargetIngredientId = &ingredientId
		recipe.TargetIngredientCount = &count

		_, err = db.Exec("insert into recipe(target_ingredient_id, duration_millis, target_ingredient_count, id, to_unlock_simultaneously_recipe_id_list) values (?, ?, ?, ?, ?)",
			ingredientId, durationMillis, count, recipeId, unlockRecipeIds)
		if err != nil {
			log.Fatal(err)
		}
		recipe.Id = int32(recipeId)
	} else {
		_, err = db.Exec("insert into recipe(duration_millis, id, to_unlock_simultaneously_recipe_id_list) values (?, ?, ?)",
			durationMillis, recipeId, unlockRecipeIds)
		if err != nil {
			log.Fatal(err)
		}
		recipe.Id = int32(recipeId)

		for _, singleBindingStr := range targetBindingList {
			var binding RecipeIngredientBinding
			var ingredientId int32
			var count int32
			_, err := fmt.Sscanf(singleBindingStr, "%d*%d", &ingredientId, &count)
			if err != nil {
				log.Fatal(err)
			}
			binding.IngredientId = ingredientId
			binding.Count = count
			binding.RecipeId = recipeId
			_, err = db.Exec("insert into recipe_ingredient_binding(recipe_id, ingredient_id, `count`, id, prepended_binocular_operator) values (?, ?, ?, ?, '=')",
				recipeId, ingredientId, count, *startedBindingId)
			*startedBindingId++
			if err != nil {
				log.Fatal(err)
			}
		}
	}
	return recipe
}

func upsertRecipeIngredientBinding(db *sql.DB, strList []string, recipeId int32, startedBindingId *int32) {
	for _, str := range strList {
		var binding RecipeIngredientBinding
		var ingredientId int32
		var count int32
		_, err := fmt.Sscanf(str, "%d*%d", &ingredientId, &count)
		if err != nil {
			log.Fatal(err)
		}
		binding.IngredientId = ingredientId
		binding.Count = count
		binding.RecipeId = recipeId
		_, err = db.Exec("insert into recipe_ingredient_binding(recipe_id, ingredient_id, `count`, id, prepended_binocular_operator) values (?, ?, ?, ?, '+')",
			recipeId, ingredientId, count, *startedBindingId)
		*startedBindingId++
		if err != nil {
			log.Fatal(err)
		}
	}
}

func upsertRecipeFromTxt(dbFile string, txtFile string) {
	file, err := os.Open(txtFile)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	db.Exec("Delete From recipe_ingredient_binding")
	db.Exec("Delete From recipe")

	scanner := bufio.NewScanner(file)
	recipeIdStrExp, _ := regexp.Compile("^\\d+:")
	bindingStrExp, _ := regexp.Compile("\\(\\S+\\)&")
	bindingRegexp, _ := regexp.Compile("\\d+\\*\\d+")
	recipeRegexp, _ := regexp.Compile("&\\(\\d+\\)->\\(\\S+\\)")
	unlockRecipeRegexp, _ := regexp.Compile(";\\S+")
	startedBindingId := new(int32)
	*startedBindingId = 1
	for scanner.Scan() {
		var recipeId int32
		var unlockRecipeStr string
		str := scanner.Text()
		if str == "" || strings.HasPrefix(str, "#") {
			continue
		}
		str = strings.Replace(str, " ", "", -1)
		fmt.Println(str)
		bindingStr := bindingStrExp.FindAllString(str, -1)[0]
		recipeStr := recipeRegexp.FindAllString(str, -1)[0]
		if len(unlockRecipeRegexp.FindAllString(str, -1)) > 0 {
			unlockRecipeStr = unlockRecipeRegexp.FindAllString(str, -1)[0][1:]
		}
		fmt.Sscanf(recipeIdStrExp.FindAllString(str, -1)[0], "%d:", &recipeId)

		recipe := upsertRecipe(db, recipeStr, recipeId, startedBindingId, unlockRecipeStr)

		upsertRecipeIngredientBinding(db, bindingRegexp.FindAllString(bindingStr, -1), recipe.Id, startedBindingId)
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}
}

func loadRecipeToTxt(dbFile string, txtFile string) {
	file, err := os.OpenFile(txtFile, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	db, err := sqlx.Open("sqlite3", dbFile)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	query, args, err := sq.Select("*").From("recipe").ToSql()
	if err != nil {
		log.Fatal(err)
	}
	rows, err := db.Queryx(query, args...)
	if err != nil {
		log.Fatal(err)
	}
	s := Recipe{}
	for rows.Next() {
		str := "("
		err := rows.StructScan(&s)
		if err != nil {
			log.Fatal(err)
		}

		query, args, err = sq.Select("*").From("recipe_ingredient_binding").
			Where(sq.Eq{"recipe_id": s.Id, "prepended_binocular_operator": "+"}).
			ToSql()
		if err != nil {
			log.Fatal(err)
		}
		bindindRows, err := db.Queryx(query, args...)
		if err != nil {
			log.Fatal(err)
		}
		binding := RecipeIngredientBinding{}
		for bindindRows.Next() {
			if binding.Id != 0 {
				str += " + "
			}
			err := bindindRows.StructScan(&binding)
			if err != nil {
				log.Fatal(err)
			}
			str += fmt.Sprintf("%d*%d", binding.IngredientId, binding.Count)
		}
		if s.TargetIngredientId != nil {
			str += fmt.Sprintf(") & (%d) -> (%d*%d)\n", s.DurationMillis, *s.TargetIngredientId, *s.TargetIngredientCount)
		} else {
			str += fmt.Sprintf(") & (%d) -> (", s.DurationMillis)
			query, args, err = sq.Select("*").From("recipe_ingredient_binding").
				Where(sq.Eq{"recipe_id": s.Id, "prepended_binocular_operator": "="}).
				ToSql()
			if err != nil {
				log.Fatal(err)
			}
			bindindRows, err := db.Queryx(query, args...)
			if err != nil {
				log.Fatal(err)
			}
			binding := RecipeIngredientBinding{}
			for bindindRows.Next() {
				if binding.Id != 0 {
					str += " + "
				}
				err := bindindRows.StructScan(&binding)
				if err != nil {
					log.Fatal(err)
				}
				str += fmt.Sprintf("%d*%d", binding.IngredientId, binding.Count)
			}
			str += ");"
			if s.ToUnlockSimultaneouslyRecipeIdList != nil {
				str += *s.ToUnlockSimultaneouslyRecipeIdList
			}
			str += "\n"
		}
		_, err = file.WriteString(str)
		if err != nil {
			log.Fatal(err)
		}
	}
}

func main() {
	//txtFile := "./equations.txt"
	//dbFile := "./preconfigured.test.sqlite"

	txtFile := flag.String("txtFile", "./equations.txt", "text file")
	dbFile := flag.String("dbFile", "./preconfigured.test.sqlite", "sqlite file")
	isUpsert := flag.Bool("U", false, "upsert to sqlite")

	flag.Parse()

	if *isUpsert {
		upsertRecipeFromTxt(*dbFile, *txtFile)
	} else {
		loadRecipeToTxt(*dbFile, *txtFile)
	}
}
