import json
import random
import string
import os

JSON_PATH = "recipes.json"   # update path if needed
BACKUP_PATH = "recipes_backup.json"


def generate_short_id(length=7):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def main():
    # -------------------------------
    # Load JSON
    # -------------------------------
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    print(f"Loaded {len(recipes)} recipes.")

    # -------------------------------
    # Backup
    # -------------------------------
    if not os.path.exists(BACKUP_PATH):
        with open(BACKUP_PATH, "w", encoding="utf-8") as b:
            json.dump(recipes, b, ensure_ascii=False, indent=2)
        print(f"Backup created: {BACKUP_PATH}")
    else:
        print("Backup already exists. Skipping.")

    # -------------------------------
    # Collect existing ShortIDs
    # -------------------------------
    existing_ids = set(
        r.get("ShortID") for r in recipes if r.get("ShortID")
    )

    # -------------------------------
    # Add ShortIDs where missing
    # -------------------------------
    new_count = 0

    for recipe in recipes:
        if "ShortID" not in recipe or not recipe["ShortID"]:
            new_id = generate_short_id()

            # Ensure uniqueness
            while new_id in existing_ids:
                new_id = generate_short_id()

            recipe["ShortID"] = new_id
            existing_ids.add(new_id)
            new_count += 1

    # -------------------------------
    # Save updated JSON
    # -------------------------------
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)

    print(f"Completed! Added {new_count} ShortIDs.")
    print("recipes.json updated successfully.")


if __name__ == "__main__":
    main()
