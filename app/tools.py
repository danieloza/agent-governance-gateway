from __future__ import annotations

from typing import Any


def hr_search_employee_policy(employee_query: str) -> dict[str, Any]:
    return {
        "employee_query": employee_query,
        "matching_policy": {
            "policy_id": "HR-001",
            "title": "Remote Work Policy",
            "summary": "Employees may work remotely up to three days per week with manager approval.",
            "contact": {
                "full_name": "Anna Kowalska",
                "email": "anna.kowalska@company.example",
                "phone": "+48 555 000 111",
            },
        },
    }


def finance_get_invoice_summary(invoice_id: str) -> dict[str, Any]:
    return {
        "invoice_id": invoice_id,
        "vendor_name": "Northwind Logistics",
        "amount": 18450.25,
        "currency": "PLN",
        "status": "pending approval",
        "approver": {
            "full_name": "Jan Nowak",
            "email": "jan.nowak@company.example",
        },
        "bank_account": "11 2222 3333 4444 5555 6666 7777",
    }


def finance_create_expense_review(expense_title: str, amount: float, currency: str) -> dict[str, Any]:
    return {
        "expense_title": expense_title,
        "amount": amount,
        "currency": currency,
        "review_case_id": "EXP-REV-2026-001",
        "submitted_by": {
            "full_name": "Maria Wisniewska",
            "email": "maria.wisniewska@company.example",
        },
        "status": "queued_for_review",
    }


def legal_search_contract_clause(contract_id: str, clause_query: str) -> dict[str, Any]:
    return {
        "contract_id": contract_id,
        "clause_query": clause_query,
        "clause_result": {
            "section": "9.2",
            "excerpt": "Either party may terminate with 30 days written notice for repeated material breach.",
            "counterparty_contact": {
                "full_name": "Adam Zielinski",
                "email": "adam.zielinski@partner.example",
                "address": "Warsaw, Example Street 1",
            },
        },
    }


def legal_summarize_contract_risk(contract_id: str) -> dict[str, Any]:
    return {
        "contract_id": contract_id,
        "risk_level": "medium",
        "summary": [
            "Termination rights are asymmetrical in favor of the supplier.",
            "Liability cap excludes delayed delivery penalties.",
            "Data processing annex references personal identifiers."
        ],
        "risk_owner": {
            "full_name": "Ewa Maj",
            "email": "ewa.maj@company.example",
            "personal_id": "ABC123456",
        },
    }


def ops_create_report(report_name: str, department: str) -> dict[str, Any]:
    return {
        "report_name": report_name,
        "department": department,
        "report_id": "OPS-REP-2026-014",
        "status": "created",
        "owner": {
            "full_name": "Piotr Wrobel",
            "email": "piotr.wrobel@company.example",
        },
    }

