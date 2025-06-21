import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RepoCombobox } from "@/components/repo-combobox"
import { listRepositories } from "@/lib/azdo"
import jest from "jest" // Declare the jest variable

// Mock the azdo module
jest.mock("@/lib/azdo", () => ({
  listRepositories: jest.fn(),
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockRepos = [
  {
    id: "1",
    name: "frontend-app",
    lastUpdateTime: "2024-01-15T10:30:00Z",
    // ... other required fields
  },
  {
    id: "2",
    name: "backend-api",
    lastUpdateTime: "2024-01-14T15:45:00Z",
    // ... other required fields
  },
]

describe("RepoCombobox", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(listRepositories as jest.Mock).mockResolvedValue(mockRepos)
  })

  it("renders loading state initially", () => {
    render(<RepoCombobox />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("loads and displays repositories", async () => {
    render(<RepoCombobox />)

    await waitFor(() => {
      expect(listRepositories).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole("combobox"))

    await waitFor(() => {
      expect(screen.getByText("frontend-app")).toBeInTheDocument()
      expect(screen.getByText("backend-api")).toBeInTheDocument()
    })
  })

  it("navigates to selected repository", async () => {
    render(<RepoCombobox />)

    await waitFor(() => {
      expect(listRepositories).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.click(screen.getByText("frontend-app"))

    expect(mockPush).toHaveBeenCalledWith("/frontend-app")
  })
})
