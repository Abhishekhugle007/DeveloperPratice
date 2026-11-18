numbers = [1, 2, 3, 4, 5]

result = map(lambda x: x * 2, numbers)

print(list(result))


#Convert names to uppercase


names = ["rahul", "amit", "john"]

result = map(str.upper, names)

print(list(result))