import cv2
import pytesseract
import matplotlib.pyplot as plt
import numpy as np

# Set Tesseract executable path
image = cv2.imread(r"C:\Users\95175\Desktop\projects\BetterMenu\BetterMenu\realSlanted.png")


# Load the image
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
plt.figure(figsize=(10, 5))
plt.imshow(gray, cmap="gray")
plt.title("gray")
plt.axis("off")
plt.show()

#CLAHE enhance
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
enhanced = clahe.apply(gray)
plt.figure(figsize=(10, 5))
plt.imshow(enhanced, cmap="gray")
plt.title("enhanced")
plt.axis("off")
plt.show()


# Apply Otsu’s Thresholding (Instead of Adaptive)
_, otsu_thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Display result
plt.figure(figsize=(10, 5))
plt.imshow(otsu_thresh, cmap="gray")
plt.title("Otsu Thresholding")
plt.axis("off")
plt.show()



# Apply OCR with better settings
text = pytesseract.image_to_string(otsu_thresh, lang="eng")

# Print the extracted text
print(text)
