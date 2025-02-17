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

clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
enhanced = clahe.apply(gray)
plt.figure(figsize=(10, 5))
plt.imshow(enhanced, cmap="gray")
plt.title("enhanced")
plt.axis("off")
plt.show()


# Apply Median Blur to remove noise instead of Gaussian
denoised = cv2.medianBlur(enhanced, 3)
plt.figure(figsize=(10, 5))
plt.imshow(denoised, cmap="gray")
plt.title("median")
plt.axis("off")
plt.show()

# Apply adaptive thresholding
adaptive_thresh = cv2.adaptiveThreshold(
    denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 10
)

# Display results
plt.figure(figsize=(10, 5))
plt.imshow(adaptive_thresh, cmap="gray")
plt.title("Adaptive Thresholding")
plt.axis("off")
plt.show()


###########################
# Apply OCR
text = pytesseract.image_to_string(adaptive_thresh, lang="eng")  

# Print the extracted text
print(text)
