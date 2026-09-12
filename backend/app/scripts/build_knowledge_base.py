from app.ai.rag_service import RAGService


def main():

    print("=" * 60)
    print("GRIDSiGHT RAG KNOWLEDGE BASE")
    print("=" * 60)

    rag = RAGService()

    count = rag.load_documents()

    print(f"\nIndexed {count} documents successfully.")

    print("\nKnowledge base ready.")


if __name__ == "__main__":
    main()