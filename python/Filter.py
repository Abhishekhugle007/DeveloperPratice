numbers = [1, 2, 3, 4, 5, 6]

result = filter(lambda x: x % 2 == 0, numbers)

print(list(result))


#Find numbers greater than 10

numbers = [5, 10, 15, 20, 25]

result = filter(lambda x: x > 10, numbers)

print(list(result))