from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from tests.conftest import TEST_LOG_ID, TEST_USER_ID, get_logs_ref, make_workday_db_data


class TestCreateLog:
    def test_should_create_workday_log_and_return_201(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        doc_ref = MagicMock()
        doc_ref.id = TEST_LOG_ID
        get_logs_ref(mock_db).document.return_value = doc_ref

        response = client.post(
            "/logs",
            json={
                "date": "2026-06-26",
                "is_holiday": False,
                "mood_morning": 3,
                "mood_after_work": 2,
                "fatigue": 2,
                "work_start": "09:00",
                "work_end": "19:30",
            },
        )

        assert response.status_code == 201
        body = response.json()
        assert body["id"] == TEST_LOG_ID
        assert body["user_id"] == TEST_USER_ID
        assert body["overtime_minutes"] == 90
        assert body["overtime_score"] == 3

    def test_should_create_holiday_log_and_return_201(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        doc_ref = MagicMock()
        doc_ref.id = TEST_LOG_ID
        get_logs_ref(mock_db).document.return_value = doc_ref

        response = client.post(
            "/logs",
            json={
                "date": "2026-06-26",
                "is_holiday": True,
                "mood_morning": 4,
                "fatigue": 1,
            },
        )

        assert response.status_code == 201
        body = response.json()
        assert body["overtime_minutes"] is None
        assert body["overtime_score"] is None

    def test_should_return_422_when_workday_missing_work_times(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        response = client.post(
            "/logs",
            json={
                "date": "2026-06-26",
                "is_holiday": False,
                "mood_morning": 3,
                "mood_after_work": 2,
                "fatigue": 2,
            },
        )

        assert response.status_code == 422


class TestListLogs:
    def test_should_return_logs_for_authenticated_user(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        mock_doc = MagicMock()
        mock_doc.to_dict.return_value = make_workday_db_data()
        logs_ref = get_logs_ref(mock_db)
        logs_ref.order_by.return_value.stream.return_value = [mock_doc]

        response = client.get("/logs")

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == TEST_LOG_ID

    def test_should_return_empty_list_when_no_logs(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        logs_ref = get_logs_ref(mock_db)
        logs_ref.order_by.return_value.stream.return_value = []

        response = client.get("/logs")

        assert response.status_code == 200
        assert response.json() == []


class TestUpdateLog:
    def test_should_update_log_and_return_200(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        db_data = make_workday_db_data()
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = True
        doc_ref.get.return_value.to_dict.return_value = db_data

        response = client.put(f"/logs/{TEST_LOG_ID}", json={"fatigue": 5})

        assert response.status_code == 200
        assert response.json()["fatigue"] == 5

    def test_should_return_404_when_log_not_found(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = False

        response = client.put(f"/logs/nonexistent-id", json={"fatigue": 5})

        assert response.status_code == 404
