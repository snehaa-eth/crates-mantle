type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  // Create a toast element
  const toastElement = document.createElement("div")
  toastElement.className = `fixed top-4 right-4 p-4 rounded-md shadow-md z-50 max-w-md ${
    variant === "destructive" ? "bg-red-500 text-white" : "bg-white text-gray-800 border border-gray-200"
  }`

  // Create title if provided
  if (title) {
    const titleElement = document.createElement("div")
    titleElement.className = "font-medium"
    titleElement.textContent = title
    toastElement.appendChild(titleElement)
  }

  // Create description if provided
  if (description) {
    const descElement = document.createElement("div")
    descElement.className = "text-sm mt-1"
    descElement.textContent = description
    toastElement.appendChild(descElement)
  }

  // Add to DOM
  document.body.appendChild(toastElement)

  // Remove after 3 seconds
  setTimeout(() => {
    toastElement.classList.add("opacity-0", "transition-opacity", "duration-300")
    setTimeout(() => {
      document.body.removeChild(toastElement)
    }, 300)
  }, 3000)
}
