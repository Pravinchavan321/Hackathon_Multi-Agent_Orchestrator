import hashlib
from backend.ai.tools.submission_tools import index_submission
from backend.ai.tools.team_tools import index_participant_skills
from backend.core.logging import log

SEED_SUBMISSIONS = [
    {
        "title": "StudyPal AI",
        "description": (
            "An AI-powered study companion that generates personalized flashcards, active-recall "
            "quizzes, and summary notes from lecture transcripts and textbook PDFs using LLMs."
        ),
    },
    {
        "title": "CogniLearn",
        "description": (
            "Intelligent learning platform with automated exam preparation, spaced repetition algorithms, "
            "and interactive question generation from university course materials."
        ),
    },
    {
        "title": "NoteGenius",
        "description": (
            "Autonomous lecture notes organizer that turns audio recordings into structured study guides, "
            "flashcard decks, and conceptual mindmaps for students."
        ),
    },
    {
        "title": "DeFi Sentinel",
        "description": (
            "Decentralized automated risk assessment bot for Ethereum and Arbitrum liquidity pools, "
            "analyzing smart contract bytecode and slippage anomalies in real-time."
        ),
    },
    {
        "title": "PoolGuard",
        "description": (
            "Real-time liquidity pool monitoring and rugpull alert system for decentralized exchanges "
            "using graph algorithms and on-chain EVM transaction tracing."
        ),
    },
    {
        "title": "HealthPulse",
        "description": (
            "Computer vision-assisted patient triage tool analyzing vital signs, dermatology photos, "
            "and triage priority scoring for emergency rooms and clinics."
        ),
    },
    {
        "title": "CareFlow AI",
        "description": (
            "Clinical workflow optimization system that transcribes doctor-patient consultations and "
            "extracts FHIR-compliant electronic health records."
        ),
    },
    {
        "title": "CodeCraft",
        "description": (
            "Automated PR code reviewer and security linter that detects logic bugs, concurrency flaws, "
            "and race conditions in Rust and Go microservices."
        ),
    },
    {
        "title": "GitSentinel",
        "description": (
            "Autonomous security auditor scanning GitHub repositories for exposed API secrets, "
            "vulnerable dependencies, and SQL injections."
        ),
    },
    {
        "title": "EcoTrack",
        "description": (
            "Supply chain carbon footprint tracker integrating IoT sensor logs with immutable ledger "
            "proofs to audit enterprise emissions."
        ),
    },
    {
        "title": "GreenChain",
        "description": (
            "Decentralized carbon credit marketplace with automated verification of solar and wind "
            "renewable energy production certificates."
        ),
    },
    {
        "title": "LegalEagle",
        "description": (
            "AI contract analysis and clause comparison engine highlighting high-risk liabilities, "
            "indemnity gaps, and non-standard terms in commercial agreements."
        ),
    },
    {
        "title": "JurisAI",
        "description": (
            "Automated legal document parser that reviews NDAs, vendor master service agreements, "
            "and employment contracts against corporate compliance policies."
        ),
    },
    {
        "title": "GameForge",
        "description": (
            "Procedural 3D game level generator and asset creator using generative diffusion models "
            "and Unreal Engine 5 native plugins."
        ),
    },
    {
        "title": "CyberShield",
        "description": (
            "Real-time network intrusion detection system using unsupervised graph neural networks "
            "to spot zero-day exploits and lateral movement in enterprise networks."
        ),
    },
    {
        "title": "AgriDrone AI",
        "description": (
            "Precision agriculture analytics platform processing multispectral drone imagery to "
            "detect crop disease, soil hydration, and yield forecasts."
        ),
    },
]

SEED_PARTICIPANTS = [
    {
        "name": "Alice Chen",
        "skills_bio": (
            "Full-stack engineer specializing in React, Next.js, TypeScript, Tailwind CSS, and Figma "
            "prototyping with 4 years experience building responsive web apps."
        ),
    },
    {
        "name": "Bob Martinez",
        "skills_bio": (
            "Backend Python engineer with deep expertise in FastAPI, PostgreSQL, Docker, Redis, "
            "distributed async queues, and LangChain multi-agent architectures."
        ),
    },
    {
        "name": "Carol Zhang",
        "skills_bio": (
            "Smart contract developer and blockchain security auditor skilled in Solidity, Foundry, "
            "Hardhat, EVM internals, and decentralized liquidity pool protocols."
        ),
    },
    {
        "name": "David Kim",
        "skills_bio": (
            "Machine Learning and NLP researcher experienced in PyTorch, Hugging Face transformers, "
            "fine-tuning LLMs, semantic vector search, and RAG pipelines."
        ),
    },
    {
        "name": "Elena Rostova",
        "skills_bio": (
            "UI/UX designer and design systems lead proficient in Figma, user research, wireframing, "
            "visual identity, motion design, and accessible web design."
        ),
    },
    {
        "name": "Frank Owusu",
        "skills_bio": (
            "DevOps and Cloud Infrastructure specialist proficient in Kubernetes, Terraform, AWS, "
            "CI/CD pipelines, Prometheus, and Grafana monitoring."
        ),
    },
    {
        "name": "Grace Hopper-Liu",
        "skills_bio": (
            "Full-stack mobile & web developer proficient in React Native, Flutter, TypeScript, "
            "GraphQL, and Firebase serverless backends."
        ),
    },
    {
        "name": "Hassan Al-Mansoor",
        "skills_bio": (
            "Data engineer and distributed systems builder with deep experience in Kafka, Apache Spark, "
            "MongoDB, ClickHouse, and high-throughput ETL pipelines."
        ),
    },
    {
        "name": "Isabella Torres",
        "skills_bio": (
            "AI engineer and computer vision specialist with hands-on experience in OpenCV, PyTorch, "
            "YOLO object detection, and multimodal models."
        ),
    },
    {
        "name": "Jack Robinson",
        "skills_bio": (
            "Product manager and technical writer with background in legal tech, compliance workflows, "
            "user story mapping, and agile sprint facilitation."
        ),
    },
]


def seed_database():
    """
    Idempotently seeds ChromaDB with realistic demo submissions and participant profiles.
    """
    print("=" * 60)
    print("  SEEDING CHROMADB VECTOR DATABASE")
    print("=" * 60)

    # 1. Seed Submissions
    submissions_indexed = 0
    for sub in SEED_SUBMISSIONS:
        sub_id = "sub-" + hashlib.md5(sub["title"].encode("utf-8")).hexdigest()[:8]
        res = index_submission.invoke({
            "submission_id": sub_id,
            "title": sub["title"],
            "description": sub["description"],
        })
        submissions_indexed += 1
        print(f"  [+] Indexed Submission: '{sub['title']}' (ID: {sub_id})")

    # 2. Seed Participants
    participants_indexed = 0
    for part in SEED_PARTICIPANTS:
        user_id = "user-" + hashlib.md5(part["name"].encode("utf-8")).hexdigest()[:8]
        res = index_participant_skills.invoke({
            "user_id": user_id,
            "name": part["name"],
            "skills_bio": part["skills_bio"],
        })
        participants_indexed += 1
        print(f"  [+] Indexed Participant: '{part['name']}' (ID: {user_id})")

    print("=" * 60)
    print(f"  SEED SUMMARY: {submissions_indexed} submissions, {participants_indexed} participants indexed successfully.")
    print("=" * 60)
    return submissions_indexed, participants_indexed


if __name__ == "__main__":
    seed_database()
