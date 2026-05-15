// 3rd-party
import { beforeEach, describe, expect, it, vi } from 'vitest'

// internal
import { BaseController } from '../base-controller.js'

// ---------------------------------------------------------------------------------------------------------------------

class TestController extends BaseController {
  public checkInvariant(input: unknown, message?: string): void {
    this.invariant(input, message ? { errorMessage: message } : undefined)
  }

  public testSendResponse(res: any, statusCode: number, data?: any): void {
    this.sendResponse(res, statusCode, data)
  }
}

describe('BaseController.invariant', () => {
  it('throws when dependency object contains undefined values', () => {
    const controller = new TestController()
    expect(() => controller.checkInvariant({ a: 1, b: undefined })).toThrowError(
      /INVARIANT EXCEPTION: dependency "b" is required/,
    )
  })

  it('throws when dependency is falsy (null)', () => {
    const controller = new TestController()
    expect(() => controller.checkInvariant(null)).toThrowError(
      /INVARIANT EXCEPTION: dependency "\{\{key\}\}" is required/,
    )
  })

  it('throws when dependency is falsy (empty string)', () => {
    const controller = new TestController()
    expect(() => controller.checkInvariant('')).toThrowError(
      /INVARIANT EXCEPTION: dependency "\{\{key\}\}" is required/,
    )
  })
})

describe('BaseController.sendResponse', () => {
  let controller: TestController
  let mockReply: any

  beforeEach(() => {
    controller = new TestController()
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
  })

  it('should send response with status code and data', () => {
    // Arrange
    const testData = { message: 'Hello World' }
    const statusCode = 200

    // Act
    controller.testSendResponse(mockReply, statusCode, testData)

    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(statusCode)
    expect(mockReply.send).toHaveBeenCalledWith(testData)
  })

  it('should send response with status code and no data', () => {
    // Arrange
    const statusCode = 204

    // Act
    controller.testSendResponse(mockReply, statusCode)

    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(statusCode)
    expect(mockReply.send).toHaveBeenCalledWith(undefined)
  })

  it('should send response with string data', () => {
    // Arrange
    const testData = 'Simple string response'
    const statusCode = 200

    // Act
    controller.testSendResponse(mockReply, statusCode, testData)

    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(statusCode)
    expect(mockReply.send).toHaveBeenCalledWith(testData)
  })

  it('should send response with number data', () => {
    // Arrange
    const testData = 42
    const statusCode = 200

    // Act
    controller.testSendResponse(mockReply, statusCode, testData)

    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(statusCode)
    expect(mockReply.send).toHaveBeenCalledWith(testData)
  })

  it('should send response with array data', () => {
    // Arrange
    const testData = [1, 2, 3]
    const statusCode = 200

    // Act
    controller.testSendResponse(mockReply, statusCode, testData)

    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(statusCode)
    expect(mockReply.send).toHaveBeenCalledWith(testData)
  })

  it('should send response with null data', () => {
    // Arrange
    const testData = null
    const statusCode = 200

    // Act
    controller.testSendResponse(mockReply, statusCode, testData)

    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(statusCode)
    expect(mockReply.send).toHaveBeenCalledWith(null)
  })

  it('should send response with different status codes', () => {
    // Arrange
    const testCases = [
      { code: 200, description: 'OK' },
      { code: 201, description: 'Created' },
      { code: 400, description: 'Bad Request' },
      { code: 401, description: 'Unauthorized' },
      { code: 404, description: 'Not Found' },
      { code: 500, description: 'Internal Server Error' },
    ]

    // Act & Assert
    for (const { code, description } of testCases) {
      controller.testSendResponse(mockReply, code, { status: description })
      expect(mockReply.status).toHaveBeenCalledWith(code)
      expect(mockReply.send).toHaveBeenCalledWith({ status: description })

      // Reset mocks for next iteration
      mockReply.status.mockClear()
      mockReply.send.mockClear()
    }
  })
})
