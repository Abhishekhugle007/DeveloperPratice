from pathlib import Path

output = Path(__file__).with_name("demo.txt")
with output.open("w", encoding="utf-8") as file:
    file.write("Hello Python , i am Abhishekh i just try to good in python")

print(f"Wrote to {output}")