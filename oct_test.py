import cv2
import pytesseract
import matplotlib.pyplot as plt
import numpy as np

# Set Tesseract executable path
image = cv2.imread(r"C:\Users\95175\Desktop\projects\BetterMenu\BetterMenu\realSlanted.png")




# Load the image
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Apply Median Blur to remove noise instead of Gaussian
denoised = cv2.medianBlur(gray, 3)

# Apply adaptive thresholding
adaptive_thresh = cv2.adaptiveThreshold(
    denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 10
)

plt.imshow(adaptive_thresh, cmap="gray")
plt.title("Adaptive Thresholding")
plt.axis("off")

# Apply morphological closing to remove small noise and gaps
kernel = np.ones((3,3), np.uint8)  # Small 3x3 kernel
morph = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_CLOSE, kernel)

# Display results
plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
plt.imshow(adaptive_thresh, cmap="gray")
plt.title("Adaptive Thresholding")
plt.axis("off")
plt.subplot(1, 2, 2)
plt.imshow(morph, cmap="gray")
plt.title("After Morphological Processing")
plt.axis("off")
plt.show()











# Apply OCR
text = pytesseract.image_to_string(gray, lang="eng")  

# Print the extracted text
print(text)
