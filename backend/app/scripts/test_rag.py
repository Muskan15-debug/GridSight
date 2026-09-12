from app.ai.rag_service import RAGService


def main():

    rag = RAGService()

    queries = [
        "What should happen when solar generation is lower than demand?",
        "How should battery storage be used during renewable energy surplus?",
        "What weather conditions can reduce solar generation?"
    ]

    for query in queries:

        print("\n" + "=" * 70)
        print("QUERY:")
        print(query)

        results = rag.retrieve(
            query,
            top_k=2
        )

        print("\nRETRIEVED KNOWLEDGE:")

        for result in results:

            print(
                f"\nSOURCE: {result['source']}"
            )

            print(
                result["content"][:700]
            )


if __name__ == "__main__":
    main()