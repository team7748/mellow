import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi, it, expect } from "vitest"
import { SpeakModePage } from "./SpeakModePage"
vi.mock("../utils/conversationData", () => ({ fetchConversationCategories: vi.fn().mockResolvedValue([]), getSpeakModeProgress: () => ({ completedConversations: [] }), saveSpeakModeProgress: vi.fn() }))
it("opens the Grammar subview from the first Speak card", async () => { render(<SpeakModePage />); const user=userEvent.setup(); await user.click(await screen.findByRole("button", { name: /Grammar/ })); expect(screen.getByRole("heading", { name: "Grammar" })).toBeInTheDocument(); expect(screen.getByText("Present Simple")).toBeInTheDocument() })
